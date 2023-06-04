mod models;
mod token_middleware;
mod mutex;
mod lib;
mod controllers;
mod utils;


use std::env;

use std::sync::{Mutex};
use actix_web::{App, HttpServer, web};
use crate::controllers::action_controller::post_action;
use crate::controllers::capabilty_controller::{get_capability_states, get_capabilties};
use crate::controllers::device_controller::{get_device_states, get_devices};
use crate::controllers::hash_controller::get_hash;
use crate::controllers::home_controller::get_home_setup;
use crate::controllers::location_controller::get_locations;
use crate::controllers::message_controller::get_messages;
use crate::controllers::relationship_controller::get_relationship;
use crate::controllers::status_controller::get_status;
use crate::controllers::user_controller::get_users;
use crate::controllers::user_storage_controller::get_user_storage;
use crate::lib::device::Device;
use crate::lib::hash::Hash;
use crate::lib::status::Status;
use crate::lib::user::User;
use crate::lib::user_storage::UserStorage;
use crate::models::token::Token;

pub struct AppState{
    token: Mutex<Token>
}

#[actix_web::main]
async fn main() -> std::io::Result<()>{
    let base_url = env::var("BASE_URL").unwrap();
    // Init
    let status = Status::new(base_url.clone());
    let users = User::new(base_url.clone());
    let devices = Device::new(base_url.clone());
    let user_storage = UserStorage::new(base_url.clone());
    let hash = Hash::new(base_url.clone());
    let message = lib::message::Message::new(base_url.clone());
    let locations = lib::location::Location::new(base_url.clone());
    let token = web::Data::new(AppState{ token: Mutex::new(Token::default())});
    let capabilties = lib::capability::Capability::new(base_url.clone());
    let home = lib::home::Home::new(base_url.clone());
    let action = lib::action::Action::new(base_url.clone());
    let relationship = lib::relationship::Relationship::new(base_url.clone());


    HttpServer::new(move || {

        App::new()
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
            .app_data(token.clone())
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}
