mod models;
mod token_middleware;
mod mutex;
mod api_lib;
mod controllers;
mod utils;
mod constants;
mod auth_middleware;
mod ws;


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
use crate::controllers::location_controller::get_locations;
use crate::controllers::message_controller::get_messages;
use crate::controllers::relationship_controller::get_relationship;
use crate::controllers::status_controller::get_status;
use crate::controllers::user_controller::get_users;
use crate::controllers::user_storage_controller::get_user_storage;
use crate::api_lib::device::Device;
use crate::api_lib::hash::Hash;
use crate::api_lib::status::Status;
use crate::api_lib::user::User;
use crate::api_lib::user_storage::UserStorage;
use crate::constants::constants::{BASIC_AUTH, OIDC_AUTH, OIDC_AUTHORITY};
use crate::controllers::api_config_controller::{get_api_config, login};
use crate::models::token::Token;
use crate::utils::connection::RedisConnection;


static WINNER: OnceLock<Addr<Lobby>> = OnceLock::new();
use tungstenite::connect;

pub struct AppState{
    token: Mutex<Token>
}

pub static CLIENT_DATA: OnceLock<Mutex<ClientData>> = OnceLock::new();


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
async fn main() -> std::io::Result<()>{
    /*
        let mut read: String = "".to_string();
        let mut resp = File::open("../response.json").unwrap();
        resp.read_to_string(&mut read).expect("TODO: panic message");
        println!("Result is {}", read[10700..10720].to_string());
    */



    let base_url = var("BASE_URL").unwrap();
    CLIENT_DATA.get_or_init(|| Mutex::new(ClientData::new("".to_string())));

    WINNER.get_or_init(|| Lobby::default().start());
    let mut oidc_opt: Option<Oidc> = None;
    if var(OIDC_AUTH).is_ok() {
        oidc_opt = Some(Oidc::new(OidcConfig::Issuer(var(OIDC_AUTHORITY).unwrap().into())).await
            .unwrap());
    }

    let token = RedisConnection::get_token().await.unwrap().access_token;

    init_socket(base_url.clone(), token).await;



    //Initialize db at startup
    RedisConnection::do_db_initialization().await;
    // Init
    let status = Status::new(base_url.clone());
    let users = User::new(base_url.clone());
    let devices = Device::new(base_url.clone());
    let user_storage = UserStorage::new(base_url.clone());
    let hash = Hash::new(base_url.clone());
    let message = api_lib::message::Message::new(base_url.clone());
    let locations = api_lib::location::Location::new(base_url.clone());
    let token = web::Data::new(AppState{ token: Mutex::new(Token::default())});
    let capabilties = api_lib::capability::Capability::new(base_url.clone());
    let home = api_lib::home::Home::new(base_url.clone());
    let action = api_lib::action::Action::new(base_url.clone());
    let relationship = api_lib::relationship::Relationship::new(base_url.clone());
    let interaction = api_lib::interaction::Interaction::new(base_url.clone());
    let redis_conn = RedisConnection::get_connection();
    let jwk_service = web::Data::new(Mutex::new(models::jwkservice::JWKService::new()));
    let unmount_service = api_lib::unmount_service::USBService::new(base_url.clone());

    let data_redis_conn = web::Data::new(redis_conn);

    spawn(||{
        println!("Starting scheduler");
        let mut scheduler = Scheduler::new();
        scheduler.every(1.day()).plus(10.minutes())
            .run(||{
                println!("Fetching data");
                let _ = async move {
                    RedisConnection::do_db_initialization().await;
                };

        });
        loop {
            scheduler.run_pending();
            thread::sleep(Duration::from_secs(10));
        }
    });
    HttpServer::new(move || {
        App::new()
            .service(start_connection)
            .service(redirect("/", "/ui/"))
            .service(get_ui_config())
            .service(login)
            .service(get_api_config)
            .service(get_secured_scope())
            .app_data(web::Data::new(action.clone()))
            .app_data(web::Data::new(unmount_service.clone()))
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
            .app_data(jwk_service.clone())
            .app_data(web::Data::new(interaction.clone()))
            .app_data(data_redis_conn.clone())
            .app_data(token.clone())
            .configure(|cfg|{
                if oidc_opt.clone().is_some() {
                    cfg.app_data(oidc_opt.clone().unwrap().clone());
                }
            })
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}

pub fn get_secured_scope() ->Scope<impl ServiceFactory<ServiceRequest, Config = (), Response = ServiceResponse<EitherBody<EitherBody<EitherBody<EitherBody<EitherBody<BoxBody>>>, EitherBody<EitherBody<BoxBody>>>>>, Error = actix_web::Error, InitError = ()>>{
        let middleware = auth_middleware::AuthFilter::new();
    let biscuit_validator = OidcBiscuitValidator { options: ValidationOptions {
        issuer: Validation::Validate(var(OIDC_AUTHORITY).unwrap_or("No authority present".to_string())),
        ..ValidationOptions::default()
    }
    };
        Scope::new("")
            .wrap(Condition::new(var(OIDC_AUTH).is_ok(),biscuit_validator))
            .wrap(Condition::new(var(BASIC_AUTH).is_ok(),middleware))
            .wrap(token_middleware::AuthFilter::new())
            .service(get_status)
            .service(get_users)
            .service(get_devices)
            .service(get_hash)
            .service(get_messages)
            .service(get_locations)
            .service(get_capabilties)
            .service(get_user_storage)
            .service(get_capability_states)
            .service(get_home_setup)
            .service(post_action)
            .service(get_relationship)
            .service(get_device_states)
            .service(get_interactions)
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
            let rs =  test.captures(path).unwrap().get(1).unwrap().as_str();
            let file = NamedFile::open_async(format!("{}/{}",
                                                     "./static", rs)).await?;
            let mut content = String::new();

            let type_of = file.content_type().to_string();
            let res = file.file().read_to_string(&mut content);

            match res {
                Ok(_) => {},
                Err(_) => {
                    return Ok(ServiceResponse::new(req.clone(), file.into_response(&req)))
                }
            }
            let res = HttpResponse::Ok()
                .content_type(type_of)
                .body(content);
            Ok(ServiceResponse::new(req, res))}))
        }

use std::thread::spawn;
use actix::{Actor, Addr};
use crate::controllers::unmount_controller::{get_usb_status, unmount_usb_storage};
use crate::controllers::websocket_controller::start_connection;
use crate::models::client_data::ClientData;
use crate::models::socket_event::SocketEvent;
use crate::ws::broadcast_message::BroadcastMessage;
use crate::ws::web_socket_message::Lobby;

pub async fn init_socket(base_url:String, token: String){

    let token_encoded = urlencoding::encode(token.as_str()).into_owned();
    spawn(move ||{
        let mut url = Url::parse(&(base_url.replace("http://","ws://") + "/events?token=" + &token_encoded)).unwrap();
        url.set_port(Some(9090)).unwrap();
        let (mut socket, _response) = connect(url).expect("Can't connect");
        let mut retries =0;

        while retries < 5 {
            loop {
                match socket.read() {
                    Ok(msg) => {
                        let parsed_message = serde_json::from_str::<SocketEvent>(&msg.to_string()).unwrap();
                        let lobby = WINNER.get().unwrap();
                        lobby.do_send(BroadcastMessage{
                            message: parsed_message
                        });
                    }
                    Err(_)=>{
                        break
                    }
                }
            }
            retries += 1;
            thread::sleep(Duration::from_secs(5));
        }
        println!("Socket connection failed");
    });
}