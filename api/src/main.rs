mod models;
mod token_middleware;
mod mutex;
mod lib;
mod controllers;
mod utils;

use std::cell::OnceCell;
use std::env;
use std::mem::MaybeUninit;
use std::sync::{Mutex, RwLock};
use actix_web::{App, HttpServer, Scope, web};
use crate::controllers::status_controller::get_status;
use crate::lib::status::Status;
use crate::models::token::Token;

pub struct AppState{
    token: Mutex<Token>
}

#[actix_web::main]
async fn main() -> std::io::Result<()>{
    let base_url = env::var("BASE_URL").unwrap();
    // Init
    let status = Status::new(base_url.clone());

    let token = web::Data::new(AppState{ token: Mutex::new(Token::default())});

    HttpServer::new(move || {

        App::new()
            .wrap(token_middleware::AuthFilter::new())
            .service(get_status)
            .app_data(web::Data::new(status.clone()))
            .app_data(token.clone())
    }).workers(4)
        .bind(("0.0.0.0", 8000))?
        .run()
        .await
}
