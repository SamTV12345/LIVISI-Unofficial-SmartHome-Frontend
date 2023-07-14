use actix_web::{get, delete, HttpResponse, Responder, put};
use actix_web::web::{Data, Path};
use reqwest::Client;
use crate::AppState;
use crate::api_lib::message::Message;

#[get("/message")]
pub async fn get_messages(messages: Data<Message>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_messages = messages.get_messages(client, access_token).await;

    return HttpResponse::Ok()
        .json(found_messages)
}

#[get("/message/{message_id}")]
pub async fn get_message_by_id(messages: Data<Message>, token: Data<AppState>, message_id: Path<String>)
    -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_messages = messages.get_message_by_id(client, access_token, message_id.clone()).await;

    return HttpResponse::Ok()
        .json(found_messages)
}

#[delete("/message/{message_id}")]
pub async fn delete_message_by_id(messages: Data<Message>, token: Data<AppState>, message_id: Path<String>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_messages = messages.delete_message_by_id(client, access_token, message_id.clone())
        .await;

    let okay = found_messages.status().is_success();

    return match okay {
        true => {
            HttpResponse::Ok()
        },
        false => {
            return HttpResponse::BadRequest()
        }
    }
}

#[put("/message/{message_id}")]
pub async fn update_message_by_id(messages: Data<Message>, token: Data<AppState>, message_id: Path<String>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_messages = messages.update_mesage_read(client, access_token, message_id.clone())
        .await;

    let okay = found_messages.status().is_success();

    return match okay {
        true => {
            HttpResponse::Ok()
        },
        false => {
            return HttpResponse::BadRequest()
        }
    }
}
