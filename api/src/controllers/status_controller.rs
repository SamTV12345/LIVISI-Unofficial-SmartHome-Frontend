use std::sync::Mutex;
use actix_web::{get, HttpResponse, Responder, Scope};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::status::Status;
use crate::models::token::Token;

#[get("/status")]
pub async fn get_status(status_lib:Data<Status>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = status_lib.get_status(client, access_token).await;
    return HttpResponse::Ok()
        .json(response);
}