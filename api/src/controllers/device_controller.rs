use actix_web::HttpResponse;
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::device::Device;
use actix_web::Responder;
use actix_web::get;

#[get("/device")]
pub async fn get_devices(device_lib: Data<Device>, token: Data<AppState>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = device_lib.get_devices(client, access_token).await;
    return HttpResponse::Ok().json(response);
}

#[get("/device/states")]
pub async fn get_device_states(device_lib: Data<Device>, token: Data<AppState>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = device_lib.get_all_device_states(client, access_token).await;
    return HttpResponse::Ok().json(response);
}