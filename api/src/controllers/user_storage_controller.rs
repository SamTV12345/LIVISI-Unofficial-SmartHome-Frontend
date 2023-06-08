use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;

use crate::api_lib::user_storage::UserStorage;
use actix_web::get;
use serde_json::Value;
use crate::constants::constants::USER_STORAGE;
use crate::utils::connection::RedisConnection;
use redis::Client as RedisClient;

#[get("/userstorage")]
pub async fn get_user_storage(redis_conn: Data<RedisClient>) -> impl Responder{
    let conn = redis_conn.get_connection().unwrap();
    let user_storage = RedisConnection::get_from_redis(conn, USER_STORAGE);
    let user_storage = serde_json::from_str::<Vec<Value>>(&user_storage).unwrap();

    return HttpResponse::Ok()
        .json(user_storage)
}