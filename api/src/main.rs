mod models;
mod api_lib;
mod utils;
mod constants;
mod store;
mod openapi_doc;

use std::cmp::Ordering;
use std::collections::HashMap;
use std::env::var;
use std::future::pending;
use std::sync::atomic::{AtomicBool, Ordering as AtomicOrdering};
use std::sync::{Mutex, OnceLock};
use std::thread;
use std::thread::spawn;
use std::time::Duration;
use chrono::{DateTime, Days, NaiveDate, Utc};
use axum::extract::ws::{Message as WsMessage, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Request, State};
use axum::http::{header, StatusCode, Uri};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use base64::engine::general_purpose;
use base64::Engine;
use clap::Parser;
use clokwerk::{Job, Scheduler, TimeUnits};
use include_dir::{include_dir, Dir};
use kv::Config;
use path_clean::clean;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sunrise::{Coordinates, SolarDay, SolarEvent};
use tokio::sync::broadcast;
use tungstenite::connect;
use utoipa::OpenApi;

use crate::api_lib::action::{Action, ActionPost};
use crate::api_lib::capability::Capability;
use crate::api_lib::device::Device;
use crate::api_lib::email::{Email, EmailAPI};
use crate::api_lib::hash::Hash;
use crate::api_lib::home::Home;
use crate::api_lib::interaction::{Interaction, InteractionResponse};
use crate::api_lib::livisi_response_type::{ErrorConstruct, LivisResponseType};
use crate::api_lib::location::{Location, LocationResponse};
use crate::api_lib::message::{Message, MessageRead};
use crate::api_lib::product::Product;
use crate::api_lib::relationship::Relationship;
use crate::api_lib::status::Status;
use crate::api_lib::unmount_service::USBService;
use crate::api_lib::user::User;
use crate::api_lib::user_storage::UserStorage;
use crate::constants::constant_types::{
    BASIC_AUTH, OIDC_AUTH, OIDC_AUTHORITY, OIDC_CLIENT_ID, OIDC_REDIRECT_URI, OIDC_SCOPE,
    PASSWORD_BASIC, USERNAME_BASIC,
};
use crate::models::client_data::ClientData;
use crate::models::socket_event::Properties::Value as SocketValue;
use crate::models::socket_event::{SocketData, SocketEvent};
use crate::store::{Data, DeviceStore, Store};
use crate::utils::connection::{Args, MemPrefill};
use crate::utils::logging::init_logging;
static WS_BROADCAST: OnceLock<broadcast::Sender<String>> = OnceLock::new();
static EMBEDDED_UI_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/static");
static IS_SHUTTING_DOWN: AtomicBool = AtomicBool::new(false);

pub static CLIENT_DATA: OnceLock<Mutex<ClientData>> = OnceLock::new();
pub static STORE_DATA: OnceLock<Store> = OnceLock::new();

#[derive(Clone)]
struct AxumState {
    status: Status,
    users: User,
    devices: Device,
    hash: Hash,
    product: Product,
    messages: Message,
    locations: Location,
    capabilities: Capability,
    home: Home,
    action: Action,
    relationship: Relationship,
    interaction: Interaction,
    usb_service: USBService,
    email: Email,
    kv_store: kv::Store,
    resource_base_url: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigModel {
    basic_auth: bool,
    oidc_configured: bool,
    oidc_config: Option<OidcConfigModel>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct OidcConfigModel {
    authority: String,
    client_id: String,
    redirect_uri: String,
    scope: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SunTimesResponse {
    geo_location: String,
    latitude: f64,
    longitude: f64,
    sunrise: Option<String>,
    sunset: Option<String>,
    next_sunrise: Option<String>,
    next_sunset: Option<String>,
    next_event_name: Option<String>,
    next_event_at: Option<String>,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    init_logging();
    let base_url = var("BASE_URL").expect("BASE_URL must be set");
    let cfg = Config::new("./db");
    let kv_store = kv::Store::new(cfg).unwrap();

    WS_BROADCAST.get_or_init(|| {
        let (sender, _) = broadcast::channel(512);
        sender
    });

    let args = Args::parse();
    init_socket(base_url.clone(), &args).await;
    MemPrefill::do_db_initialization(&args).await;

    let status = Status::new(&base_url);
    let users = User::new(&base_url);
    let devices = Device::new(&base_url);
    let _user_storage = UserStorage::new(&base_url);
    let hash = Hash::new(&base_url);
    let product = Product::new(&base_url);
    let message = Message::new(&base_url);
    let locations = Location::new(&base_url);
    let capabilities = Capability::new(&base_url);
    let home = Home::new(&base_url);
    let action = Action::new(&base_url);
    let relationship = Relationship::new(&base_url);
    let interaction = Interaction::new(&base_url);
    let usb_service = USBService::new(&base_url);
    let email = Email::new(&base_url);

    let state = AxumState {
        status,
        users,
        devices,
        hash,
        product,
        messages: message,
        locations,
        capabilities,
        home,
        action,
        relationship,
        interaction,
        usb_service,
        email,
        kv_store,
        resource_base_url: base_url.replace(":8080", ""),
    };

    spawn(|| {
        let args = Args::parse();
        log::info!("Starting scheduler");
        let mut scheduler = Scheduler::new();
        scheduler.every(1.days()).plus(10.minutes()).run(move || {
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap();
            rt.block_on(async {
                log::info!("Fetching data");
                MemPrefill::do_db_initialization(&args).await;
            });
        });

        loop {
            scheduler.run_pending();
            thread::sleep(Duration::from_secs(10));
        }
    });

    let secured_router = Router::new()
        .route("/email/settings", get(get_email_settings).put(update_email_settings))
        .route("/email/test", get(test_email))
        .route("/data/capability", get(get_capabilities_temperature))
        .route("/status", get(get_status))
        .route("/users", get(get_users))
        .route("/device", get(get_devices))
        .route("/device/states", get(get_device_states))
        .route("/product", get(get_products))
        .route("/product/hash", get(get_hash))
        .route("/message", get(get_messages))
        .route(
            "/message/:message_id",
            get(get_message_by_id)
                .put(update_message_by_id)
                .delete(delete_message_by_id),
        )
        .route("/location", get(get_locations).post(create_location))
        .route(
            "/location/:id",
            get(get_location_by_id)
                .put(update_location)
                .delete(delete_location),
        )
        .route("/capability", get(get_capabilities))
        .route("/capability/states", get(get_capability_states))
        .route("/userstorage", get(get_user_storage))
        .route("/home/setup", get(get_home_setup))
        .route("/service/sun-times", get(get_sun_times))
        .route("/action", post(post_action))
        .route("/relationship", get(get_relationship))
        .route("/interaction", get(get_interactions))
        .route(
            "/interaction/:id",
            get(get_interaction_by_id).put(update_interaction_by_id),
        )
        .route("/interaction/:id/trigger", post(trigger_interaction))
        .route("/api/all", get(get_all_api))
        .route("/unmount", get(unmount_usb_storage))
        .route("/usb_storage", get(get_usb_status))
        .route_layer(middleware::from_fn(basic_auth_middleware));

    let app = Router::new()
        .route("/", get(root_redirect))
        .route("/api/server", get(get_api_config))
        .route("/api-docs/openapi.json", get(get_openapi_json))
        .route("/health/live", get(liveness_probe))
        .route("/health/ready", get(readiness_probe))
        .route("/login", post(login))
        .route("/websocket", get(start_connection))
        .route("/images/*tail", get(get_images))
        .route("/resources/*tail", get(get_resources))
        .route("/ui", get(ui_redirect))
        .route("/ui/", get(index))
        .route("/ui/*path", get(get_ui_file))
        .merge(secured_router)
        .with_state(state);

    log::info!("Starting Axum server at port 8000. The UI is served at /ui/");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
}

async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(err) = tokio::signal::ctrl_c().await {
            log::error!("Could not install Ctrl+C handler: {}", err);
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(err) => {
                log::error!("Could not install SIGTERM handler: {}", err);
                pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    IS_SHUTTING_DOWN.store(true, AtomicOrdering::Relaxed);
    log::info!("Shutdown signal received. Draining in-flight HTTP requests.");
}

async fn basic_auth_middleware(request: Request, next: Next) -> Response {
    if var(BASIC_AUTH).is_err() {
        return next.run(request).await;
    }

    let expected_username = match var(USERNAME_BASIC) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
                "Unauthorized",
            )
                .into_response();
        }
    };
    let expected_password = match var(PASSWORD_BASIC) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
                "Unauthorized",
            )
                .into_response();
        }
    };

    let authorization = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    let Some(authorization) = authorization else {
        return (
            StatusCode::UNAUTHORIZED,
            [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
            "Unauthorized",
        )
            .into_response();
    };

    let Some(encoded_part) = authorization.strip_prefix("Basic ") else {
        return (
            StatusCode::UNAUTHORIZED,
            [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
            "Unauthorized",
        )
            .into_response();
    };

    let decoded = match general_purpose::STANDARD.decode(encoded_part) {
        Ok(data) => data,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
                "Unauthorized",
            )
                .into_response();
        }
    };

    let decoded = match String::from_utf8(decoded) {
        Ok(data) => data,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
                "Unauthorized",
            )
                .into_response();
        }
    };

    let mut parts = decoded.splitn(2, ':');
    let username = parts.next().unwrap_or_default();
    let password = parts.next().unwrap_or_default();

    if username != expected_username || password != expected_password {
        return (
            StatusCode::UNAUTHORIZED,
            [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
            "Unauthorized",
        )
            .into_response();
    }

    next.run(request).await
}

async fn root_redirect() -> impl IntoResponse {
    Redirect::temporary("/ui/")
}

async fn ui_redirect() -> impl IntoResponse {
    Redirect::temporary("/ui/")
}

async fn index() -> Response {
    serve_ui_asset("index.html".to_string(), true).await
}

async fn get_ui_file(Path(path): Path<String>) -> Response {
    serve_ui_asset(path, true).await
}

async fn serve_ui_asset(path: String, fallback_to_index: bool) -> Response {
    let requested_path = clean("/".to_owned() + path.trim_start_matches('/'));
    let requested_str = requested_path.to_string_lossy().replace('\\', "/");

    if !requested_str.starts_with('/') {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }

    let relative_path = requested_str.trim_start_matches('/');
    let has_file_extension = relative_path.contains('.');

    if has_file_extension {
        return serve_embedded_ui_file(relative_path)
            .unwrap_or_else(|| (StatusCode::NOT_FOUND, "Not found").into_response());
    }

    if fallback_to_index {
        return serve_embedded_ui_file("index.html").unwrap_or_else(|| {
            log::warn!("No embedded UI build found. index.html missing in api/static at compile time.");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                "Embedded UI missing. Build ui-new and rebuild the Rust binary.",
            )
                .into_response()
        });
    }

    (StatusCode::NOT_FOUND, "Not found").into_response()
}

fn serve_embedded_ui_file(path: &str) -> Option<Response> {
    EMBEDDED_UI_DIR.get_file(path).map(|file| {
        (
            [(header::CONTENT_TYPE, content_type_from_path(path))],
            file.contents().to_vec(),
        )
            .into_response()
    })
}

async fn get_images(State(state): State<AxumState>, Path(tail): Path<String>) -> Response {
    get_cached_remote_asset(state, "images", tail).await
}

async fn get_resources(State(state): State<AxumState>, Path(tail): Path<String>) -> Response {
    get_cached_remote_asset(state, "resources", tail).await
}

async fn get_cached_remote_asset(state: AxumState, prefix: &str, tail: String) -> Response {
    let requested_path = clean(format!("/{}/{}", prefix, tail));
    let requested_str = requested_path.to_string_lossy().replace('\\', "/");

    if !requested_str.starts_with(&format!("/{}", prefix)) {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }

    let bucket = match state.kv_store.bucket::<String, String>(Some("images")) {
        Ok(bucket) => bucket,
        Err(err) => {
            log::error!("Could not open KV bucket: {}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, "KV store error").into_response();
        }
    };

    if let Ok(Some(cached_data)) = bucket.get(&requested_str) {
        return (
            [(header::CONTENT_TYPE, content_type_from_path(&requested_str))],
            cached_data,
        )
            .into_response();
    }

    let shc_path = format!("{}{}", state.resource_base_url, requested_str.replace('\\', "/"));
    let data = match reqwest::get(shc_path).await {
        Ok(response) => match response.text().await {
            Ok(body) => body,
            Err(err) => {
                log::error!("Could not read remote asset body: {}", err);
                return (StatusCode::BAD_GATEWAY, "Could not read remote asset").into_response();
            }
        },
        Err(err) => {
            log::error!("Could not fetch remote asset: {}", err);
            return (StatusCode::BAD_GATEWAY, "Could not fetch remote asset").into_response();
        }
    };

    if let Err(err) = bucket.set(&requested_str, &data) {
        log::warn!("Could not cache remote asset {}: {}", requested_str, err);
    }

    (
        [(header::CONTENT_TYPE, content_type_from_path(&requested_str))],
        data,
    )
        .into_response()
}

async fn start_connection(ws: WebSocketUpgrade) -> impl IntoResponse {
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

async fn get_api_config() -> impl IntoResponse {
    let basic_auth = var(BASIC_AUTH).is_ok();
    let oidc_configured = var(OIDC_AUTH).is_ok();

    let mut config = ConfigModel {
        basic_auth,
        oidc_configured,
        oidc_config: None,
    };

    if oidc_configured {
        config.oidc_config = Some(OidcConfigModel {
            redirect_uri: var(OIDC_REDIRECT_URI)
                .expect("OIDC redirect uri not configured"),
            authority: var(OIDC_AUTHORITY)
                .expect("OIDC authority not configured"),
            client_id: var(OIDC_CLIENT_ID)
                .expect("OIDC client id not configured"),
            scope: var(OIDC_SCOPE).unwrap_or("openid profile email".to_string()),
        });
    }

    Json(config)
}

async fn liveness_probe() -> Response {
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "probe": "liveness",
            "timestamp": Utc::now().to_rfc3339()
        })),
    )
        .into_response()
}

async fn readiness_probe() -> Response {
    if IS_SHUTTING_DOWN.load(AtomicOrdering::Relaxed) {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "not_ready",
                "probe": "readiness",
                "reason": "shutting_down",
                "timestamp": Utc::now().to_rfc3339()
            })),
        )
            .into_response();
    }

    let Some(store) = STORE_DATA.get() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "not_ready",
                "probe": "readiness",
                "reason": "store_not_initialized",
                "timestamp": Utc::now().to_rfc3339()
            })),
        )
            .into_response();
    };

    let data = match store.data.lock() {
        Ok(data) => data,
        Err(err) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "not_ready",
                    "probe": "readiness",
                    "reason": "store_lock_failed",
                    "error": err.to_string(),
                    "timestamp": Utc::now().to_rfc3339()
                })),
            )
                .into_response();
        }
    };

    let has_core_state = data.status.is_some()
        || !data.devices.is_empty()
        || !data.locations.is_empty()
        || data.user_storage.is_some()
        || data.email.is_some();

    let payload = json!({
        "status": if has_core_state { "ready" } else { "not_ready" },
        "probe": "readiness",
        "timestamp": Utc::now().to_rfc3339(),
        "checks": {
            "statusLoaded": data.status.is_some(),
            "devicesLoaded": !data.devices.is_empty(),
            "locationsLoaded": !data.locations.is_empty(),
            "userStorageLoaded": data.user_storage.is_some(),
            "emailLoaded": data.email.is_some()
        },
        "counts": {
            "devices": data.devices.len(),
            "locations": data.locations.len(),
            "interactions": data.interactions.len(),
            "messages": data.messages.len()
        }
    });

    if has_core_state {
        (StatusCode::OK, Json(payload)).into_response()
    } else {
        (StatusCode::SERVICE_UNAVAILABLE, Json(payload)).into_response()
    }
}

fn normalized_sort_key(value: &str) -> String {
    value.trim().to_lowercase()
}

fn device_display_name(device_id: &str, device: &DeviceStore) -> String {
    device
        .config
        .as_ref()
        .and_then(|config| config.name.clone())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| device_id.to_string())
}

fn canonical_device_id(device_id: &str) -> &str {
    device_id.strip_prefix("/device/").unwrap_or(device_id)
}

fn compare_devices(
    left_id: &str,
    left_device: &DeviceStore,
    right_id: &str,
    right_device: &DeviceStore,
) -> Ordering {
    let left_name = normalized_sort_key(&device_display_name(left_id, left_device));
    let right_name = normalized_sort_key(&device_display_name(right_id, right_device));
    left_name
        .cmp(&right_name)
        .then_with(|| left_id.cmp(right_id))
}

fn sorted_devices_map_value(devices: &HashMap<String, DeviceStore>) -> Value {
    let mut entries: Vec<(&String, &DeviceStore)> = devices.iter().collect();
    entries.sort_by(|(left_id, left_device), (right_id, right_device)| {
        compare_devices(left_id, left_device, right_id, right_device)
    });

    let mut sorted_map = serde_json::Map::new();
    for (device_id, device) in entries {
        match serde_json::to_value(device) {
            Ok(device_value) => {
                sorted_map.insert(device_id.clone(), device_value);
            }
            Err(err) => {
                log::warn!("Could not serialize device {}: {}", device_id, err);
            }
        }
    }

    Value::Object(sorted_map)
}

fn sorted_locations(locations: &[LocationResponse], devices: &HashMap<String, DeviceStore>) -> Vec<LocationResponse> {
    let mut sorted_locations = locations.to_vec();
    sorted_locations.sort_by(|left, right| {
        normalized_sort_key(&left.config.name)
            .cmp(&normalized_sort_key(&right.config.name))
            .then_with(|| left.id.cmp(&right.id))
    });

    for location in &mut sorted_locations {
        if let Some(device_ids) = location.devices.as_mut() {
            device_ids.sort_by(|left_id, right_id| {
                let left_canonical = canonical_device_id(left_id);
                let right_canonical = canonical_device_id(right_id);
                let left_device = devices.get(left_canonical);
                let right_device = devices.get(right_canonical);

                match (left_device, right_device) {
                    (Some(left_device), Some(right_device)) => {
                        compare_devices(left_canonical, left_device, right_canonical, right_device)
                    }
                    (Some(_), None) => Ordering::Less,
                    (None, Some(_)) => Ordering::Greater,
                    (None, None) => normalized_sort_key(left_id)
                        .cmp(&normalized_sort_key(right_id)),
                }
            });
            device_ids.dedup();
        }
    }

    sorted_locations
}

fn sorted_interactions(interactions: &[InteractionResponse]) -> Vec<InteractionResponse> {
    let mut sorted_interactions = interactions.to_vec();
    sorted_interactions.sort_by(|left, right| {
        let left_name = normalized_sort_key(left.name.as_deref().unwrap_or(&left.id));
        let right_name = normalized_sort_key(right.name.as_deref().unwrap_or(&right.id));
        left_name
            .cmp(&right_name)
            .then_with(|| left.id.cmp(&right.id))
    });
    sorted_interactions
}

fn sorted_data_value(data: &Data) -> Value {
    let mut value = match serde_json::to_value(data) {
        Ok(value) => value,
        Err(err) => {
            log::warn!("Could not serialize /api/all payload: {}", err);
            Value::Object(serde_json::Map::new())
        }
    };

    if let Value::Object(map) = &mut value {
        map.insert("devices".to_string(), sorted_devices_map_value(&data.devices));
        map.insert(
            "locations".to_string(),
            serde_json::to_value(sorted_locations(&data.locations, &data.devices))
                .unwrap_or(Value::Array(Vec::new())),
        );
        map.insert(
            "interactions".to_string(),
            serde_json::to_value(sorted_interactions(&data.interactions))
                .unwrap_or(Value::Array(Vec::new())),
        );
    }

    value
}

async fn login(Json(auth): Json<LoginRequest>) -> Response {
    if var(BASIC_AUTH).is_err() {
        return (StatusCode::UNAUTHORIZED, Json(json!("Username or password incorrect")))
            .into_response();
    }

    let username = var(USERNAME_BASIC).unwrap_or_default();
    let password = var(PASSWORD_BASIC).unwrap_or_default();
    if auth.username == username && auth.password == password {
        return (StatusCode::OK, Json(json!("Login successful"))).into_response();
    }

    (StatusCode::UNAUTHORIZED, Json(json!("Username or password incorrect"))).into_response()
}

async fn get_status(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.status.get_status().await)
}

async fn get_users(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.users.get_users().await)
}

async fn get_devices() -> Response {
    let data = STORE_DATA.get().unwrap().data.lock().unwrap();
    Json(sorted_devices_map_value(&data.devices)).into_response()
}

async fn get_device_states(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.devices.get_all_device_states().await)
}

async fn get_hash(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.hash.get_hash().await)
}

async fn get_openapi_json() -> impl IntoResponse {
    Json(openapi_doc::ApiDoc::openapi())
}

async fn get_products(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.product.get_products().await)
}

async fn get_messages(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.messages.get_messages().await)
}

async fn get_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
) -> impl IntoResponse {
    Json(state.messages.get_message_by_id(message_id).await)
}

async fn delete_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
) -> Response {
    let response = state.messages.delete_message_by_id(message_id).await;
    if response.status().is_success() {
        StatusCode::OK.into_response()
    } else {
        StatusCode::BAD_REQUEST.into_response()
    }
}

async fn update_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
    Json(message_read): Json<MessageRead>,
) -> Response {
    let response = state
        .messages
        .update_mesage_read(message_id, MessageRead {
            read: message_read.read,
        })
        .await;
    if response.status().is_success() {
        StatusCode::OK.into_response()
    } else {
        StatusCode::BAD_REQUEST.into_response()
    }
}

async fn get_locations() -> Response {
    let data = STORE_DATA.get().unwrap().data.lock().unwrap();
    Json(sorted_locations(&data.locations, &data.devices)).into_response()
}

async fn get_location_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.locations.get_location_by_id(id).await)
}

async fn create_location(
    State(state): State<AxumState>,
    Json(location_data): Json<LocationResponse>,
) -> impl IntoResponse {
    Json(state.locations.create_location(location_data).await)
}

async fn update_location(
    State(state): State<AxumState>,
    Path(id): Path<String>,
    Json(location_data): Json<LocationResponse>,
) -> impl IntoResponse {
    Json(state.locations.update_location(location_data, id).await)
}

async fn delete_location(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.locations.delete_location(id).await)
}

async fn get_capabilities() -> Response {
    let capabilities = &STORE_DATA.get().unwrap().data.lock().unwrap().capabilities;
    Json(capabilities.clone()).into_response()
}

async fn get_capability_states(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.capabilities.get_all_capability_states().await)
}

async fn get_user_storage() -> Response {
    let user_storage = &STORE_DATA.get().unwrap().data.lock().unwrap().user_storage;
    Json(user_storage.clone()).into_response()
}

async fn get_home_setup(State(state): State<AxumState>) -> impl IntoResponse {
    match state.home.get_home_setup().await {
        Ok(home_setup) => (StatusCode::OK, Json(home_setup)).into_response(),
        Err(error) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({
                "error": error
            })),
        )
            .into_response(),
    }
}

async fn get_sun_times(State(state): State<AxumState>) -> Response {
    let home_setup = match state.home.get_home_setup().await {
        Ok(home_setup) => home_setup,
        Err(error) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "error": error
                })),
            )
                .into_response();
        }
    };
    let geo_location = home_setup.config.geo_location.clone();
    let (latitude, longitude) = match parse_geo_location(&geo_location) {
        Some(coords) => coords,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "Invalid geoLocation in home setup",
                    "geoLocation": geo_location
                })),
            )
                .into_response();
        }
    };

    let now = Utc::now();
    let today = now.date_naive();
    let tomorrow = today
        .checked_add_days(Days::new(1))
        .unwrap_or(today);

    let sunrise_today = solar_event_time_for_date(latitude, longitude, today, SolarEvent::Sunrise);
    let sunset_today = solar_event_time_for_date(latitude, longitude, today, SolarEvent::Sunset);
    let sunrise_tomorrow = solar_event_time_for_date(latitude, longitude, tomorrow, SolarEvent::Sunrise);
    let sunset_tomorrow = solar_event_time_for_date(latitude, longitude, tomorrow, SolarEvent::Sunset);

    let next_sunrise = first_future_event(now, sunrise_today, sunrise_tomorrow);
    let next_sunset = first_future_event(now, sunset_today, sunset_tomorrow);

    let next_event = match (next_sunrise, next_sunset) {
        (Some(sunrise), Some(sunset)) => {
            if sunrise <= sunset {
                Some(("sunrise".to_string(), sunrise))
            } else {
                Some(("sunset".to_string(), sunset))
            }
        }
        (Some(sunrise), None) => Some(("sunrise".to_string(), sunrise)),
        (None, Some(sunset)) => Some(("sunset".to_string(), sunset)),
        (None, None) => None,
    };

    let response = SunTimesResponse {
        geo_location,
        latitude,
        longitude,
        sunrise: sunrise_today.map(|time| time.to_rfc3339()),
        sunset: sunset_today.map(|time| time.to_rfc3339()),
        next_sunrise: next_sunrise.map(|time| time.to_rfc3339()),
        next_sunset: next_sunset.map(|time| time.to_rfc3339()),
        next_event_name: next_event.as_ref().map(|event| event.0.clone()),
        next_event_at: next_event.map(|event| event.1.to_rfc3339()),
    };

    (StatusCode::OK, Json(response)).into_response()
}

async fn post_action(
    State(state): State<AxumState>,
    Json(action_data): Json<ActionPost>,
) -> Response {
    match state.action.post_action(action_data).await {
        LivisResponseType::Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        LivisResponseType::Err(err) => map_livisi_error(err),
    }
}

async fn get_relationship(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.relationship.get_relationship().await)
}

async fn get_interactions(State(state): State<AxumState>) -> impl IntoResponse {
    Json(sorted_interactions(&state.interaction.get_interaction().await))
}

async fn get_interaction_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.interaction.get_interaction_by_id(id).await)
}

async fn update_interaction_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    match state.interaction.update_interaction_by_id(id, body).await {
        Ok(response) => {
            let refreshed_interactions = state.interaction.get_interaction().await;
            if let Some(store_data) = STORE_DATA.get() {
                if let Ok(mut data) = store_data.data.lock() {
                    data.set_interactions(refreshed_interactions);
                }
            }
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(err) => (StatusCode::BAD_GATEWAY, Json(json!({ "error": err }))).into_response(),
    }
}

async fn trigger_interaction(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> Response {
    match state.interaction.trigger_interaction(id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(err) => (StatusCode::BAD_GATEWAY, Json(json!({ "error": err }))).into_response(),
    }
}

async fn get_all_api() -> Response {
    let store = STORE_DATA.get().unwrap();
    let data = store.data.lock().unwrap();
    Json(sorted_data_value(&data)).into_response()
}

async fn unmount_usb_storage(State(state): State<AxumState>) -> Response {
    state.usb_service.unmount_usb_storage().await;
    (StatusCode::OK, "USB storage unmounted.").into_response()
}

async fn get_usb_status(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.usb_service.get_usb_status().await)
}

async fn get_email_settings(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.email.get_email_settings().await)
}

async fn update_email_settings(
    State(state): State<AxumState>,
    Json(email_data): Json<EmailAPI>,
) -> Response {
    let status = state.email.update_email_settings(&email_data).await;
    if let Some(store_data) = STORE_DATA.get() {
        if let Ok(mut store) = store_data.data.lock() {
            store.email = Some(email_data);
        }
    }
    StatusCode::from_u16(status)
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
        .into_response()
}

async fn test_email(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.email.test_email().await)
}

async fn get_capabilities_temperature(
    State(state): State<AxumState>,
    uri: Uri,
) -> Response {
    if uri.path() != "/data/capability" {
        return (StatusCode::BAD_REQUEST, "Invalid URL").into_response();
    }

    let full_url = uri
        .path_and_query()
        .map(|path_and_query| path_and_query.as_str().to_string())
        .unwrap_or_else(|| uri.path().to_string());

    let response = state.capabilities.get_historic_data(&full_url).await;
    Json(response).into_response()
}

fn parse_geo_location(geo_location: &str) -> Option<(f64, f64)> {
    let mut tokens: Vec<String> = Vec::new();
    let mut current = String::new();

    for char in geo_location.chars() {
        if char.is_ascii_digit() || char == '.' || char == '-' || char == '+' {
            current.push(char);
        } else if !current.is_empty() {
            tokens.push(current.clone());
            current.clear();
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    if tokens.len() < 2 {
        return None;
    }

    let mut first = tokens[0].parse::<f64>().ok()?;
    let mut second = tokens[1].parse::<f64>().ok()?;

    if !(-90.0..=90.0).contains(&first)
        && (-90.0..=90.0).contains(&second)
        && (-180.0..=180.0).contains(&first)
    {
        std::mem::swap(&mut first, &mut second);
    }

    if !(-90.0..=90.0).contains(&first) || !(-180.0..=180.0).contains(&second) {
        return None;
    }

    Some((first, second))
}

fn solar_event_time_for_date(
    latitude: f64,
    longitude: f64,
    date: NaiveDate,
    event: SolarEvent,
) -> Option<DateTime<Utc>> {
    let coordinates = Coordinates::new(latitude, longitude)?;
    SolarDay::new(coordinates, date).event_time(event)
}

fn first_future_event(
    now: DateTime<Utc>,
    first: Option<DateTime<Utc>>,
    second: Option<DateTime<Utc>>,
) -> Option<DateTime<Utc>> {
    if let Some(time) = first {
        if time > now {
            return Some(time);
        }
    }
    second.filter(|time| *time > now)
}

fn map_livisi_error(err: ErrorConstruct) -> Response {
    let status = match err.errorcode {
        1000 => StatusCode::INTERNAL_SERVER_ERROR,
        1001 => StatusCode::EXPECTATION_FAILED,
        1002 => StatusCode::REQUEST_TIMEOUT,
        1003 => StatusCode::INTERNAL_SERVER_ERROR,
        1004 => StatusCode::BAD_REQUEST,
        1005 => StatusCode::BAD_REQUEST,
        1006 => StatusCode::SERVICE_UNAVAILABLE,
        1007 => StatusCode::BAD_REQUEST,
        1008 => StatusCode::PRECONDITION_FAILED,
        2000 => StatusCode::BAD_REQUEST,
        2001 => StatusCode::FORBIDDEN,
        2002 => StatusCode::FORBIDDEN,
        2003 => StatusCode::UNAUTHORIZED,
        2004 => StatusCode::FORBIDDEN,
        2005 => StatusCode::FORBIDDEN,
        2006 => StatusCode::CONFLICT,
        2007 => StatusCode::UNAUTHORIZED,
        2008 => StatusCode::FORBIDDEN,
        2009 => StatusCode::UNAUTHORIZED,
        2010 => StatusCode::FORBIDDEN,
        2011 => StatusCode::FORBIDDEN,
        2012 => StatusCode::FAILED_DEPENDENCY,
        2013 => StatusCode::FORBIDDEN,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };

    (status, Json(err)).into_response()
}

fn content_type_from_path(path: &str) -> &'static str {
    if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".js") || path.ends_with(".mjs") {
        "application/javascript; charset=utf-8"
    } else if path.ends_with(".map") {
        "application/json; charset=utf-8"
    } else if path.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if path.ends_with(".json") {
        "application/json; charset=utf-8"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".gif") {
        "image/gif"
    } else if path.ends_with(".webp") {
        "image/webp"
    } else if path.ends_with(".woff") {
        "font/woff"
    } else if path.ends_with(".woff2") {
        "font/woff2"
    } else if path.ends_with(".ttf") {
        "font/ttf"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else {
        "application/octet-stream"
    }
}

fn build_livisi_ws_url(base_url: &str, token: &str) -> Option<Url> {
    let ws_base = if base_url.starts_with("https://") {
        base_url.replacen("https://", "wss://", 1)
    } else {
        base_url.replacen("http://", "ws://", 1)
    };

    let mut url = match Url::parse(
        &(ws_base.trim_end_matches('/').to_string() + "/events?token=" + token),
    ) {
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

    if let Some(store_data) = STORE_DATA.get() {
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

pub async fn init_socket(base_url: String, x: &Args) {
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
            match connect(url.clone()) {
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
