
use actix_web::HttpResponse;
use actix_web::web::Data;

use crate::api_lib::device::{Device, DeviceResponse};
use actix_web::Responder;
use actix_web::get;



use crate::utils::connection::RedisConnection;


use crate::constants::constants::DEVICES;
use crate::STORE_DATA;

#[get("/device")]
pub async fn get_devices()
    -> impl
Responder {
    let devices = &STORE_DATA.get().unwrap().data.lock().unwrap().devices;
    HttpResponse::Ok().json(devices)
}

#[get("/device/states")]
pub async fn get_device_states(device_lib: Data<Device>) -> impl Responder {
    let response = device_lib.get_all_device_states().await;
    HttpResponse::Ok().json(response)
}