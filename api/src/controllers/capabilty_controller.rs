use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::capability::Capability;
use actix_web::get;

#[get("/capability")]
pub async fn get_capabilties(capability_lib: Data<Capability>, token: Data<AppState>) -> impl
Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let capabilities = capability_lib.get_capabilities(client, access_token).await;
    return HttpResponse::Ok().json(capabilities);
}

#[get("/capability/states")]
pub async fn get_capability_states(capability_lib: Data<Capability>, token: Data<AppState>) -> impl
Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let capabilities = capability_lib.get_all_capability_states(client, access_token).await;
    return HttpResponse::Ok().json(capabilities);
}