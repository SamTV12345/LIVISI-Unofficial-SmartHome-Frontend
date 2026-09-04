use axum::extract::ws::{Message as WsMessage, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use reqwest::Url;
use serde_json::json;
use std::thread;
use std::thread::spawn;
use std::time::Duration;
use tokio::sync::broadcast;
use tungstenite::connect;

use crate::models::socket_event::Properties::Value as SocketValue;
use crate::models::socket_event::{SocketData, SocketEvent};
use crate::utils::connection::{Args, MemPrefill};
use crate::{SENTRY_SERVICE_DATA, STORE_DATA};

static WS_BROADCAST: std::sync::OnceLock<broadcast::Sender<String>> = std::sync::OnceLock::new();

pub(crate) async fn start_connection(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(websocket_session)
}

async fn websocket_session(mut socket: WebSocket) {
    let sender = WS_BROADCAST.get_or_init(|| {
        let (sender, _) = broadcast::channel(512);
        sender
    });
    let mut receiver = sender.subscribe();

    loop {
        tokio::select! {
            broadcast_item = receiver.recv() => {
                match broadcast_item {
                    Ok(payload) => {
                        if socket.send(WsMessage::Text(payload.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {
                        continue;
                    }
                    Err(_) => {
                        break;
                    }
                }
            }
            incoming = socket.recv() => {
                match incoming {
                    Some(Ok(WsMessage::Ping(payload))) => {
                        if socket.send(WsMessage::Pong(payload)).await.is_err() {
                            break;
                        }
                    }
                    Some(Ok(WsMessage::Close(_))) | None => {
                        break;
                    }
                    Some(Ok(_)) => {}
                    Some(Err(_)) => {
                        break;
                    }
                }
            }
        }
    }
}

fn build_livisi_ws_url(base_url: &str, token: &str, is_classic: bool) -> Option<Url> {
    let ws_base = if base_url.starts_with("https://") {
        base_url.replacen("https://", "wss://", 1)
    } else {
        base_url.replacen("http://", "ws://", 1)
    };

    let mut url =
        match Url::parse(&(ws_base.trim_end_matches('/').to_string() + "/events?token=" + token)) {
            Ok(url) => url,
            Err(err) => {
                log::error!("Could not parse websocket URL from BASE_URL: {}", err);
                return None;
            }
        };

    // SHC 1 ("Classic") hosts the events websocket on the same port as its REST
    // API (8080); SHC 2 uses a dedicated port (9090). See the openHAB
    // livisismarthome binding's URLCreator.createEventsURL().
    let port = if is_classic { 8080 } else { 9090 };
    if let Err(err) = url.set_port(Some(port)) {
        log::error!("Could not set websocket port to {}: {:?}", port, err);
        return None;
    }

    Some(url)
}

/// Determines whether the connected SHC is the first-generation ("Classic")
/// controller. Classic controllers are exposed as a device with type "SHC";
/// the second generation uses "SHCA" (see the openHAB binding's DeviceDTO).
fn is_classic_controller() -> bool {
    match STORE_DATA.get() {
        Some(store_data) => match store_data.data.lock() {
            Ok(data) => data.devices.values().any(|device| device.r#type == "SHC"),
            Err(err) => {
                log::warn!(
                    "Could not acquire store lock to detect controller type: {}",
                    err
                );
                false
            }
        },
        None => false,
    }
}

fn process_socket_payload(payload: &str) {
    let mut parsed_message = match serde_json::from_str::<SocketEvent>(payload) {
        Ok(parsed_message) => parsed_message,
        Err(err) => {
            log::warn!("Ignoring malformed websocket payload: {}", err);
            return;
        }
    };

    let sentry_alert = if let Some(store_data) = STORE_DATA.get() {
        match store_data.data.lock() {
            Ok(mut data) => data.handle_socket_event(&mut parsed_message),
            Err(err) => {
                log::warn!("Could not acquire store lock for websocket event: {}", err);
                return;
            }
        }
    } else {
        log::warn!("Store is not initialized yet. Dropping websocket event.");
        return;
    };

    if let Some(alert) = sentry_alert
        && let Some(sentry_service) = SENTRY_SERVICE_DATA.get()
    {
        sentry_service.dispatch_alert(alert);
    }

    if let Some(SocketValue(props)) = &parsed_message.properties {
        log::debug!("Unhandled websocket properties payload: {}", props);
    }

    if let Some(SocketData::Value(data)) = &parsed_message.data {
        log::debug!("Unhandled websocket data payload: {}", data);
    }

    let sender = WS_BROADCAST.get_or_init(|| {
        let (sender, _) = broadcast::channel(512);
        sender
    });
    let payload = json!({
        "message": parsed_message
    })
    .to_string();
    let _ = sender.send(payload);
}

pub(crate) async fn init_socket(base_url: String, x: &Args) {
    if x.file.is_some() {
        return;
    }

    spawn(move || {
        // The reconnect loop relies on tungstenite's blocking `connect`/`read`,
        // so we keep a small runtime around purely to drive the async token fetch.
        let rt = match tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
        {
            Ok(rt) => rt,
            Err(err) => {
                log::error!("Could not build websocket runtime: {}", err);
                return;
            }
        };

        let reset_delay = Duration::from_secs(1);
        let max_retry_delay = Duration::from_secs(60);
        let mut retry_delay = reset_delay;

        loop {
            // Re-fetch a fresh token on every (re)connect. The token captured at
            // startup eventually expires; without refreshing it here a reconnect
            // would silently fail forever and realtime updates would stop until
            // the gateway is restarted.
            match rt.block_on(MemPrefill::get_token()) {
                Ok(token) => {
                    let token_encoded =
                        urlencoding::encode(token.access_token.as_str()).into_owned();
                    let is_classic = is_classic_controller();
                    if let Some(url) = build_livisi_ws_url(&base_url, &token_encoded, is_classic) {
                        match connect(url.as_str()) {
                            Ok((mut socket, _response)) => {
                                log::info!("Connected to Livisi websocket.");
                                retry_delay = reset_delay;
                                while let Ok(msg) = socket.read() {
                                    process_socket_payload(&msg.to_string());
                                }
                                log::warn!("Livisi websocket disconnected.");
                            }
                            Err(err) => {
                                log::warn!("Livisi websocket connection failed: {}", err);
                            }
                        }
                    }
                }
                Err(err) => {
                    log::warn!("Could not get token for websocket subscription: {:?}", err);
                }
            }

            thread::sleep(retry_delay);
            retry_delay = std::cmp::min(retry_delay + retry_delay, max_retry_delay);
        }
    });
}
