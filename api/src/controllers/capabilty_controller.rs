use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;

use crate::{STORE_DATA};
use crate::api_lib::capability::{Capability};
use actix_web::get;

#[get("/capability")]
pub async fn get_capabilties() -> impl
Responder {
    let capabilities = &STORE_DATA.get().unwrap().data.lock().unwrap().capabilities;
    HttpResponse::Ok()
        .json(capabilities)
}

#[get("/capability/states")]
pub async fn get_capability_states(capability_lib: Data<Capability>) -> impl
Responder {
    let capabilities = capability_lib.get_all_capability_states().await;
    HttpResponse::Ok().json(capabilities)
}