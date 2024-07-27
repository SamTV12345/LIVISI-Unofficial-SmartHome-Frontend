use actix_web::{delete, get, HttpResponse, post, put, Responder, web};
use actix_web::web::{Data, Path};


use crate::api_lib::location::{Location, LocationResponse};

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


#[post("/location")]
pub async fn create_location(location_data: web::Json<LocationResponse>, location: Data<Location>) -> impl Responder {
    let location = location.create_location(location_data.into_inner()).await;

    HttpResponse::Ok().json(location)
}


#[put("/location/{id}")]
pub async fn update_location(location_data: web::Json<LocationResponse>, location: Data<Location>, id: Path<String>) -> impl Responder {
    let location = location.update_location(location_data.into_inner(), id.clone()).await;

    HttpResponse::Ok().json(location)
}

#[delete("/location/{id}")]
pub async fn delete_location(location: Data<Location>, id: Path<String>) -> impl Responder {
    let location = location.delete_location(id.clone()).await;

    HttpResponse::Ok().json(location)
}