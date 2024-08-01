mod models;
mod token_middleware;
mod api_lib;
mod controllers;
mod utils;
mod constants;
mod auth_middleware;
mod ws;
mod store;

use std::{env, thread};
use std::env::var;

use std::io::Read;

use std::sync::{Mutex, OnceLock};
use std::time::Duration;
use actix_web::middleware::{Condition};
use actix_4_jwt_auth::{Oidc, OidcBiscuitValidator, OidcConfig};
use actix_4_jwt_auth::biscuit::{Validation, ValidationOptions};
use actix_files::NamedFile;
use actix_web::{App, HttpResponse, HttpServer, Responder, Scope, web};
use actix_web::body::{BoxBody, EitherBody};
use actix_web::dev::{fn_service, ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::web::redirect;
use clokwerk::{Job, Scheduler, TimeUnits};

use regex::Regex;
use reqwest::{Url};

use crate::controllers::action_controller::post_action;
use crate::controllers::capabilty_controller::{get_capability_states, get_capabilties};
use crate::controllers::device_controller::{get_device_states, get_devices};
use crate::controllers::hash_controller::get_hash;
use crate::controllers::home_controller::get_home_setup;
use crate::controllers::interaction_controller::get_interactions;
use crate::controllers::location_controller::{create_location, delete_location, get_location_by_id, get_locations, update_location};
use crate::controllers::message_controller::{get_scope_messages};
use crate::controllers::relationship_controller::get_relationship;
use crate::controllers::status_controller::get_status;
use crate::controllers::user_controller::get_users;
use crate::controllers::user_storage_controller::get_user_storage;
use crate::api_lib::device::Device;
use crate::api_lib::hash::Hash;
use crate::api_lib::status::Status;
use crate::api_lib::user::User;
use crate::api_lib::user_storage::UserStorage;
use crate::constants::constant_types::{BASIC_AUTH, OIDC_AUTH, OIDC_AUTHORITY};
use crate::controllers::api_config_controller::{get_api_config, login};
use crate::models::token::Token;
use crate::utils::connection::MemPrefill;

static WINNER: OnceLock<Addr<Lobby>> = OnceLock::new();
use tungstenite::connect;

pub struct AppState {
    token: Mutex<Token>,
}

pub static CLIENT_DATA: OnceLock<Mutex<ClientData>> = OnceLock::new();

pub static STORE_DATA: OnceLock<Store> = OnceLock::new();

async fn index() -> impl Responder {
    let index_html = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/static/index.html"
    ));


    HttpResponse::Ok()
        .content_type("text/html")
        .body(index_html)
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let cfg = Config::new("./db");
    let store = kv::Store::new(cfg).unwrap();
    let store_images = store.bucket::<String, String>(Some("images")).unwrap();

    init_logging();
    let base_url = var("BASE_URL").unwrap();

    WINNER.get_or_init(|| Lobby::default().start());
    let mut oidc_opt: Option<Oidc> = None;
    if var(OIDC_AUTH).is_ok() {
        oidc_opt = Some(Oidc::new(OidcConfig::Issuer(var(OIDC_AUTHORITY).unwrap().into())).await
            .unwrap());
    }

    let token = MemPrefill::get_token().await.unwrap().access_token;

    init_socket(base_url.clone(), token).await;

    //Initialize db at startup
    MemPrefill::do_db_initialization().await;


    // Init
    let status = Status::new(&base_url);
    let users = User::new(&base_url);
    let devices = Device::new(&base_url);
    let user_storage = UserStorage::new(&base_url);
    let hash = Hash::new(&base_url);
    let message = api_lib::message::Message::new(&base_url);
    let locations = api_lib::location::Location::new(&base_url);
    let token = web::Data::new(AppState { token: Mutex::new(Token::default()) });
    let capabilties = api_lib::capability::Capability::new(&base_url);
    let home = api_lib::home::Home::new(&base_url);
    let action = api_lib::action::Action::new(&base_url);
    let relationship = api_lib::relationship::Relationship::new(&base_url);
    let interaction = api_lib::interaction::Interaction::new(&base_url);
    let unmount_service = api_lib::unmount_service::USBService::new(&base_url);
    let bucket_images = web::Data::new(store_images);
    let email = api_lib::email::Email::new(&base_url);

    spawn(|| {
        log::info!("Starting scheduler");
        let mut scheduler = Scheduler::new();
        scheduler.every(1.days()).plus(10.minutes())
            .run(|| {
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build().unwrap();

                rt.block_on(async {
                    log::info!("Fetching data");
                    MemPrefill::do_db_initialization().await;
                });
            });


        loop {
            scheduler.run_pending();
            thread::sleep(Duration::from_secs(10));
        }
    });


    HttpServer::new(move || {
        App::new()
            .service(start_connection)
            .service(get_images)
            .service(get_resources)
            .service(redirect("/", "/ui/"))
            .service(get_ui_config())
            .service(login)
            .service(get_api_config)
            .service(get_secured_scope())
            .app_data(bucket_images.clone())
            .app_data(web::Data::new(action.clone()))
            .app_data(web::Data::new(unmount_service.clone()))
            .app_data(web::Data::new(email.clone()))
            .app_data(web::Data::new(home.clone()))
            .app_data(web::Data::new(status.clone()))
            .app_data(web::Data::new(users.clone()))
            .app_data(web::Data::new(devices.clone()))
            .app_data(web::Data::new(hash.clone()))
            .app_data(web::Data::new(user_storage.clone()))
            .app_data(web::Data::new(message.clone()))
            .app_data(web::Data::new(capabilties.clone()))
            .app_data(web::Data::new(locations.clone()))
            .app_data(web::Data::new(relationship.clone()))
            .app_data(web::Data::new(interaction.clone()))
            .app_data(token.clone())
            .configure(|cfg| {
                if oidc_opt.clone().is_some() {
                    cfg.app_data(oidc_opt.clone().unwrap().clone());
                }
            })
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}

pub fn get_secured_scope() -> Scope<impl ServiceFactory<ServiceRequest, Config=(), Response=ServiceResponse<EitherBody<EitherBody<EitherBody<EitherBody<EitherBody<BoxBody>>>, EitherBody<EitherBody<BoxBody>>>>>, Error=actix_web::Error, InitError=()>> {
    let middleware = auth_middleware::AuthFilter::new();
    let biscuit_validator = OidcBiscuitValidator {
        options: ValidationOptions {
            issuer: Validation::Validate(var(OIDC_AUTHORITY).unwrap_or("No authority present".to_string())),
            ..ValidationOptions::default()
        }
    };
    Scope::new("")
        .wrap(Condition::new(var(OIDC_AUTH).is_ok(), biscuit_validator))
        .wrap(Condition::new(var(BASIC_AUTH).is_ok(), middleware))
        .wrap(token_middleware::AuthFilter::new())
        .service(get_email_routes())
        .service(get_capability_routes())
        .service(get_status)
        .service(get_users)
        .service(get_devices)
        .service(get_hash)
        .service(get_scope_messages())
        .service(get_locations)
        .service(create_location)
        .service(get_location_by_id)
        .service(get_capabilties)
        .service(get_user_storage)
        .service(get_capability_states)
        .service(delete_location)
        .service(update_location)
        .service(get_home_setup)
        .service(post_action)
        .service(get_relationship)
        .service(get_device_states)
        .service(get_interactions)
        .service(get_all_api)
        .service(unmount_usb_storage)
        .service(get_usb_status)
}

pub fn get_ui_config() -> Scope {
    web::scope("/ui")
        .service(redirect("", "/ui/"))
        .route("/index.html", web::get().to(index))
        .route("/{path:[^.]*}", web::get().to(index))
        .default_service(fn_service(|req: ServiceRequest| async {
            let (req, _) = req.into_parts();
            let path = req.path();

            let test = Regex::new(r"/ui/(.*)").unwrap();
            let rs = test.captures(path).unwrap().get(1).unwrap().as_str();
            let file = NamedFile::open_async(format!("{}/{}",
                                                     "./static", rs)).await?;
            let mut content = String::new();

            let type_of = file.content_type().to_string();
            let res = file.file().read_to_string(&mut content);

            match res {
                Ok(_) => {}
                Err(_) => {
                    return Ok(ServiceResponse::new(req.clone(), file.into_response(&req)))
                }
            }
            let res = HttpResponse::Ok()
                .content_type(type_of)
                .body(content);
            Ok(ServiceResponse::new(req, res))
        }))
}

use std::thread::spawn;
use actix::{Actor, Addr};
use kv::Config;
use crate::controllers::all_api::get_all_api;
use crate::controllers::data_controller::get_capability_routes;
use crate::controllers::email_controller::get_email_routes;
use crate::controllers::images_controller::{get_images, get_resources};
use crate::controllers::unmount_controller::{get_usb_status, unmount_usb_storage};
use crate::controllers::websocket_controller::start_connection;
use crate::models::client_data::ClientData;
use crate::models::socket_event::Properties::Value;
use crate::models::socket_event::{SocketData, SocketEvent};
use crate::store::Store;
use crate::utils::logging::init_logging;
use crate::ws::broadcast_message::BroadcastMessage;
use crate::ws::web_socket_message::Lobby;

pub async fn init_socket(base_url: String, token: String) {
    let token_encoded = urlencoding::encode(token.as_str()).into_owned();
    spawn(move || {
        let mut url = Url::parse(&(base_url.replace("http://", "ws://") + "/events?token=" + &token_encoded)).unwrap();
        url.set_port(Some(9090)).unwrap();
        let (mut socket, _response) = connect(url).expect("Can't connect");
        let mut retries = 0;

        while retries < 5 {
            while let Ok(msg) = socket.read() {
                let mut parsed_message = serde_json::from_str::<SocketEvent>(&msg.to_string()).unwrap();
                let store_data = STORE_DATA.get().unwrap();
                let mut data = store_data.data.lock().unwrap();
                println!("Data: {:?}", parsed_message);
                data.handle_socket_event(&mut parsed_message);
                if let Some(Value(props)) = &parsed_message.properties {
                    log::error!("Unknown properties!! {}", props);
                }

                if let Some(SocketData::Value(data)) = &parsed_message.data {
                    log::error!("Unknown data!! {}", data);
                }


                let lobby = WINNER.get().unwrap();
                lobby.do_send(BroadcastMessage {
                    message: parsed_message
                });
            }
            retries += 1;
            thread::sleep(Duration::from_secs(5));
        }
        log::info!("Socket connection failed");
    });
}