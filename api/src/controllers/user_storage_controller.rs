use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;




use actix_web::get;
use serde_json::Value;
use crate::constants::constants::USER_STORAGE;
use crate::utils::connection::RedisConnection;
use crate::STORE_DATA;

#[get("/userstorage")]
pub async fn get_user_storage() -> impl Responder{
    let user_storage = &STORE_DATA.get().unwrap().data.lock().unwrap().user_storage;
    HttpResponse::Ok()
        .json(user_storage)
}