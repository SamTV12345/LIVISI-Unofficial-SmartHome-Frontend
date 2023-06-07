mod models;
mod token_middleware;
mod mutex;
mod api_lib;
mod controllers;
mod utils;
mod constants;


use std::{env, thread};

use std::sync::{Mutex};
use std::time::Duration;
use actix_web::{App, HttpServer, web};
use clokwerk::{Job, Scheduler, TimeUnits};

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
use crate::models::token::Token;
use crate::utils::connection::RedisConnection;

pub struct AppState{
    token: Mutex<Token>
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
            .app_data(web::Data::new(interaction.clone()))
            .app_data(data_redis_conn.clone())
            .app_data(token.clone())
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}
