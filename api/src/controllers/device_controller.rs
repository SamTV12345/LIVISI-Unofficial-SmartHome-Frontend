use std::thread;
use actix_web::HttpResponse;
use actix_web::web::Data;
use crate::AppState;
use crate::lib::device::Device;
use actix_web::Responder;
use actix_web::get;
use redis::{Client as RedisClient, Commands, RedisResult};
use reqwest::Client;
use serde_json::json;
use serde::Serialize;
use crate::utils::connection::RedisConnection;
use tokio::runtime::Runtime;
use tokio::time::*;

#[get("/device")]
pub async fn get_devices(device_lib: Data<Device>, token: Data<AppState>, redis_conn: Data<RedisClient>)
    -> impl
Responder {

    let mut conn = redis_conn.get_connection().unwrap();
    let mut conn2 = redis_conn.get_connection().unwrap();

    tokio::spawn(async move {
        let client = Client::new();
        let access_token = token.token.lock().unwrap().access_token.clone();

        let response = device_lib.get_devices(client, access_token).await;
        let stringified_response = serde_json::to_string(&response).unwrap();
        RedisConnection::save_to_redis(conn2,"devices",&stringified_response.clone());
    });
    let devices_string = RedisConnection::get_from_redis(conn, "devices");

    return HttpResponse::Ok().json(devices_string);
}

#[get("/device/states")]
pub async fn get_device_states(device_lib: Data<Device>, token: Data<AppState>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = device_lib.get_all_device_states(client, access_token).await;
    return HttpResponse::Ok().json(response);
}