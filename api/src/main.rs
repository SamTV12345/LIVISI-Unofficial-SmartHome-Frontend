mod models;
mod token_middleware;
mod mutex;
mod lib;
mod controllers;
mod utils;


use std::env;

use std::sync::{Mutex};
use actix_web::{App, HttpServer, web};
use crate::controllers::device_controller::get_devices;
use crate::controllers::status_controller::get_status;
use crate::controllers::user_controller::get_users;
use crate::lib::device::Device;
use crate::lib::status::Status;
use crate::lib::user::User;
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

    let token = web::Data::new(AppState{ token: Mutex::new(Token::default())});

    HttpServer::new(move || {

        App::new()
            .wrap(token_middleware::AuthFilter::new())
            .service(get_status)
            .service(get_users)
            .service(get_devices)
            .app_data(web::Data::new(status.clone()))
            .app_data(web::Data::new(users.clone()))
            .app_data(web::Data::new(devices.clone()))
            .app_data(token.clone())
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}
