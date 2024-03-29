
use actix_web::HttpResponse;
use actix_web::web::Data;

use crate::api_lib::device::{Device, DeviceResponse};
use actix_web::Responder;
use actix_web::get;
use redis::{Client as RedisClient};



use crate::utils::connection::RedisConnection;


use crate::constants::constants::DEVICES;

#[get("/device")]
pub async fn get_devices(redis_conn: Data<RedisClient>)
    -> impl
Responder {

    let conn = redis_conn.get_connection().unwrap();
    let devices_string = RedisConnection::get_from_redis(conn, DEVICES);
    let devices = serde_json::from_str::<DeviceResponse>(&devices_string).unwrap();
    HttpResponse::Ok().json(devices)
}

#[get("/device/states")]
pub async fn get_device_states(device_lib: Data<Device>) -> impl Responder {
    let response = device_lib.get_all_device_states().await;
    HttpResponse::Ok().json(response)
}