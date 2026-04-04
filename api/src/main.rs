mod api_lib;
mod constants;
mod models;
mod openapi_doc;
mod sentry;
mod server;
mod store;
mod utils;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;
use clap::Parser;
use clokwerk::{Job, Scheduler, TimeUnits};
use kv::Config;
use std::env::var;
use std::sync::{Mutex, OnceLock};
use std::thread;
use std::thread::spawn;
use std::time::Duration;

use crate::api_lib::action::Action;
use crate::api_lib::capability::Capability;
use crate::api_lib::device::Device;
use crate::api_lib::email::Email;
use crate::api_lib::hash::Hash;
use crate::api_lib::home::Home;
use crate::api_lib::interaction::Interaction;
use crate::api_lib::location::Location;
use crate::api_lib::message::Message;
use crate::api_lib::product::Product;
use crate::api_lib::relationship::Relationship;
use crate::api_lib::status::Status;
use crate::api_lib::unmount_service::USBService;
use crate::api_lib::user::User;
use crate::api_lib::user_storage::UserStorage;
use crate::models::client_data::ClientData;
use crate::server::auth::{
    auth_middleware, build_auth_runtime, get_api_config, login, AuthRuntime,
};
use crate::server::handlers::*;
use crate::server::health::{liveness_probe, readiness_probe, shutdown_signal};
use crate::server::ui::{get_images, get_resources, get_ui_file, index, root_redirect, ui_redirect};
use crate::server::ws::{init_socket, start_connection};
use crate::sentry::SentryService;
use crate::store::Store;
use crate::utils::connection::{Args, MemPrefill};
use crate::utils::logging::init_logging;

pub static CLIENT_DATA: OnceLock<Mutex<ClientData>> = OnceLock::new();
pub static STORE_DATA: OnceLock<Store> = OnceLock::new();
pub static SENTRY_SERVICE_DATA: OnceLock<SentryService> = OnceLock::new();

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
    sentry_service: SentryService,
    kv_store: kv::Store,
    resource_base_url: String,
    auth_runtime: AuthRuntime,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    init_logging();
    let base_url = var("BASE_URL").expect("BASE_URL must be set");
    let cfg = Config::new("./db");
    let kv_store = kv::Store::new(cfg).unwrap();

    let args = Args::parse();
    init_socket(base_url.clone(), &args).await;
    MemPrefill::do_db_initialization(&args).await;
    let sentry_service = SentryService::new().await.expect("Could not initialize sentry service");
    let _ = SENTRY_SERVICE_DATA.set(sentry_service.clone());
    if let Some(store_data) = STORE_DATA.get() {
        if let Ok(mut data) = store_data.data.lock() {
            data.set_sentry_settings(sentry_service.get_settings());
        }
    }

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
    let auth_runtime = build_auth_runtime().await;

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
        sentry_service,
        kv_store,
        resource_base_url: base_url.replace(":8080", ""),
        auth_runtime: auth_runtime.clone(),
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
        .route("/websocket", get(start_connection))
        .route(
            "/email/settings",
            get(get_email_settings).put(update_email_settings),
        )
        .route("/email/test", get(test_email))
        .route(
            "/sentry/settings",
            get(get_sentry_settings).put(update_sentry_settings),
        )
        .route("/sentry/test", post(test_sentry_notification))
        .route("/data/capability", get(get_capabilities_temperature))
        .route("/status", get(get_status))
        .route("/users", get(get_users))
        .route("/device", get(get_devices))
        .route("/device/states", get(get_device_states))
        .route("/product", get(get_products))
        .route("/product/hash", get(get_hash))
        .route("/message", get(get_messages))
        .route(
            "/message/{message_id}",
            get(get_message_by_id)
                .put(update_message_by_id)
                .delete(delete_message_by_id),
        )
        .route("/location", get(get_locations).post(create_location))
        .route(
            "/location/{id}",
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
            "/interaction/{id}",
            get(get_interaction_by_id).put(update_interaction_by_id),
        )
        .route("/interaction/{id}/trigger", post(trigger_interaction))
        .route("/api/all", get(get_all_api))
        .route("/unmount", get(unmount_usb_storage))
        .route("/usb_storage", get(get_usb_status))
        .route_layer(middleware::from_fn_with_state(
            auth_runtime,
            auth_middleware,
        ));

    let app = Router::new()
        .route("/", get(root_redirect))
        .route("/api/server", get(get_api_config))
        .route("/api-docs/openapi.json", get(get_openapi_json))
        .route("/health/live", get(liveness_probe))
        .route("/health/ready", get(readiness_probe))
        .route("/login", post(login))
        .route("/images/{*tail}", get(get_images))
        .route("/resources/{*tail}", get(get_resources))
        .route("/ui", get(ui_redirect))
        .route("/ui/", get(index))
        .route("/ui/{*path}", get(get_ui_file))
        .merge(secured_router)
        .with_state(state);

    log::info!("Starting Axum server at port 8000. The UI is served at /ui/");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
}
