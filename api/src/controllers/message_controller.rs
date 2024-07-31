use actix_web::{get, delete, HttpResponse, Responder, put, web, Scope};
use actix_web::web::{Data, Path};
use serde_derive::{Deserialize, Serialize};
use crate::AppState;
use crate::api_lib::message::Message;

#[get("")]
pub async fn get_messages(messages: Data<Message>, _token: Data<AppState>) -> impl Responder{

    let found_messages = messages.get_messages().await;

    HttpResponse::Ok()
        .json(found_messages)
}

#[get("{message_id}")]
pub async fn get_message_by_id(messages: Data<Message>, message_id: Path<String>)
    -> impl Responder{

    let found_messages = messages.get_message_by_id(message_id.clone()).await;

    HttpResponse::Ok()
        .json(found_messages)
}

#[delete("{message_id}")]
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

#[derive(Deserialize, Serialize)]
pub struct MessageRead {
    read: bool
}

#[put("{message_id}")]
pub async fn update_message_by_id(messages: Data<Message>, message_id: Path<String>,
                                  message_read: web::Json<MessageRead>) ->
                                                                                             impl Responder {
    let found_messages = messages.update_mesage_read(message_id.clone(), message_read.into_inner())
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


pub fn get_scope_messages() -> Scope {
    Scope::new("/message")
        .service(update_message_by_id)
        .service(delete_message_by_id)
        .service(get_message_by_id)
        .service(get_messages)
}
