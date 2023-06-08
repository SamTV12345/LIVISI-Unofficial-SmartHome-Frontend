mod models;
mod token_middleware;
mod mutex;
mod api_lib;
mod controllers;
mod utils;
mod constants;
mod auth_middleware;


use std::{env, thread};
use std::env::var;
use std::io::Read;

use std::sync::{Mutex};
use std::time::Duration;
use actix::dev::Condition;
use actix_files::NamedFile;
use actix_web::{App, HttpResponse, HttpServer, Responder, Scope, web};
use actix_web::body::{BoxBody, EitherBody};
use actix_web::dev::{fn_service, ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::web::redirect;
use clokwerk::{Job, Scheduler, TimeUnits};
use redis::Value::Data;

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
use crate::controllers::api_config_controller::{get_api_config, login};
use crate::models::token::Token;
use crate::utils::connection::RedisConnection;

pub struct AppState{
    token: Mutex<Token>
}

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

    //Initialize db at startup
    RedisConnection::do_db_initialization().await;
    let base_url = env::var("BASE_URL").unwrap();
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

    let data_redis_conn = web::Data::new(redis_conn);

    thread::spawn(||{
        println!("Starting scheduler");
        let mut scheduler = Scheduler::new();
        scheduler.every(1.day()).plus(10.minutes())
            .run(||{
                println!("Fetching data");
                tokio::spawn(async move {
                    RedisConnection::do_db_initialization().await;
                });

        });
        loop {
            scheduler.run_pending();
            thread::sleep(Duration::from_secs(10));
        }
    });
    HttpServer::new(move || {
        App::new()
            .service(get_ui_config)
            .service(login)
            .service(get_api_config)
            .service(get_secured_scope())
            .app_data(web::Data::new(action.clone()))
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
            .app_data(web::Data::new(jwk_service.clone()))
            .app_data(web::Data::new(interaction.clone()))
            .app_data(data_redis_conn.clone())
            .app_data(token.clone())
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}

pub fn get_secured_scope()->Scope<impl ServiceFactory<ServiceRequest, Config = (), Response = ServiceResponse<EitherBody<EitherBody<BoxBody>>>, Error = actix_web::Error, InitError = ()>>{
        Scope::new("")
            .wrap(auth_middleware::AuthFilter::new())
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
}


pub fn get_ui_config() -> Scope {
    web::scope("/ui")
        .service(redirect("", "./"))
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
            if type_of.contains("css"){
                content  = fix_links(&content)
            }
            else if type_of.contains("javascript"){
                content = fix_links(&content)
            }
            let res = HttpResponse::Ok()
                .content_type(type_of)
                .body(content);
            Ok(ServiceResponse::new(req, res))}))

}
