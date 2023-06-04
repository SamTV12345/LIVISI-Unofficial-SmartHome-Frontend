use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::message::Message;

#[get("/message")]
pub async fn get_messages(messages: Data<Message>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_messages = messages.get_message(client, access_token).await;

    return HttpResponse::Ok()
        .json(found_messages)
}