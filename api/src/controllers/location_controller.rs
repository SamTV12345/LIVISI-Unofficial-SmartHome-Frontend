use actix_web::{get, HttpResponse, Responder};
use actix_web::web::{Data, Path};


use crate::api_lib::location::{Location};

use crate::STORE_DATA;

#[get("/location")]
pub async fn get_locations() -> impl Responder{
    let locations = &STORE_DATA.get().unwrap().data.lock().unwrap().locations;
    HttpResponse::Ok().json(locations)
}

#[get("/location/{id}")]
pub async fn get_location_by_id(location: Data<Location>, id: Path<String>) ->impl
Responder {
    let location = location.get_location_by_id(id.clone()).await;

    HttpResponse::Ok().json(location)
}