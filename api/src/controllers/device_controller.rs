use std::thread;
use actix_web::HttpResponse;
use actix_web::web::Data;
use crate::AppState;
use crate::lib::device::{Device, DeviceResponse};
use actix_web::Responder;
use actix_web::get;
use redis::{Client as RedisClient, Commands, RedisResult};
use reqwest::Client;
use serde_json::json;
use serde::Serialize;
use crate::utils::connection::RedisConnection;
use tokio::runtime::Runtime;
use tokio::time::*;
use crate::constants::constants::DEVICES;

#[get("/device")]
pub async fn get_devices(redis_conn: Data<RedisClient>)
    -> impl
Responder {

    let mut conn = redis_conn.get_connection().unwrap();
    let devices_string = RedisConnection::get_from_redis(conn, DEVICES);
    let devices = serde_json::from_str::<DeviceResponse>(&devices_string).unwrap();
    return HttpResponse::Ok().json(devices);
}

#[get("/device/states")]
pub async fn get_device_states(device_lib: Data<Device>, token: Data<AppState>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = device_lib.get_all_device_states(client, access_token).await;
    return HttpResponse::Ok().json(response);
}