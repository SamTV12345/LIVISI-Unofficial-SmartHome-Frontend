use actix_web::{get, delete, HttpResponse, Responder, put};
use actix_web::web::{Data, Path};

use crate::AppState;
use crate::api_lib::message::Message;

#[get("/message")]
pub async fn get_messages(messages: Data<Message>, _token: Data<AppState>) -> impl Responder{

    let found_messages = messages.get_messages().await;

    HttpResponse::Ok()
        .json(found_messages)
}

#[get("/message/{message_id}")]
pub async fn get_message_by_id(messages: Data<Message>, message_id: Path<String>)
    -> impl Responder{

    let found_messages = messages.get_message_by_id(message_id.clone()).await;

    HttpResponse::Ok()
        .json(found_messages)
}

#[delete("/message/{message_id}")]
pub async fn delete_message_by_id(messages: Data<Message>, _token: Data<AppState>, message_id: Path<String>) -> impl Responder {

    let found_messages = messages.delete_message_by_id(message_id.clone())
        .await;

    let okay = found_messages.status().is_success();

    match okay {
        true => {
            HttpResponse::Ok()
        },
        false => {
            HttpResponse::BadRequest()
        }
    }
}

#[put("/message/{message_id}")]
pub async fn update_message_by_id(messages: Data<Message>, _token: Data<AppState>, message_id: Path<String>) -> impl Responder {
    let found_messages = messages.update_mesage_read(message_id.clone())
        .await;

    let okay = found_messages.status().is_success();

    match okay {
        true => {
            HttpResponse::Ok()
        },
        false => {
            HttpResponse::BadRequest()
        }
    }
}
