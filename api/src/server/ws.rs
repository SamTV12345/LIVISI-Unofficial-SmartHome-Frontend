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

fn build_livisi_ws_url(base_url: &str, token: &str) -> Option<Url> {
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

    if let Err(err) = url.set_port(Some(9090)) {
        log::error!("Could not set websocket port to 9090: {:?}", err);
        return None;
    }

    Some(url)
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

    if let Some(alert) = sentry_alert {
        if let Some(sentry_service) = SENTRY_SERVICE_DATA.get() {
            sentry_service.dispatch_alert(alert);
        }
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

    let token = match MemPrefill::get_token().await {
        Ok(token) => token,
        Err(err) => {
            log::error!("Could not get token for websocket subscription: {:?}", err);
            return;
        }
    };

    let token_encoded = urlencoding::encode(token.access_token.as_str()).into_owned();
    spawn(move || {
        let Some(url) = build_livisi_ws_url(&base_url, &token_encoded) else {
            return;
        };

        let mut retry_delay = Duration::from_secs(1);
        let max_retry_delay = Duration::from_secs(60);

        loop {
            match connect(url.as_str()) {
                Ok((mut socket, _response)) => {
                    log::info!("Connected to Livisi websocket.");
                    retry_delay = Duration::from_secs(1);
                    while let Ok(msg) = socket.read() {
                        process_socket_payload(&msg.to_string());
                    }
                    log::warn!("Livisi websocket disconnected.");
                }
                Err(err) => {
                    log::warn!("Livisi websocket connection failed: {}", err);
                }
            }

            thread::sleep(retry_delay);
            retry_delay = std::cmp::min(retry_delay + retry_delay, max_retry_delay);
        }
    });
}
