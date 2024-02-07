use actix_web::{get, HttpResponse, Responder};
use actix_web::web::{Data, Path};


use crate::api_lib::location::{Location, LocationResponse};
use crate::utils::connection::RedisConnection;
use redis::{Client as RedisClient};

use crate::constants::constants::LOCATIONS;

#[get("/location")]
pub async fn get_locations(redis: Data<RedisClient>) -> impl Responder{
    let conn = redis.get_connection().unwrap();
    let locations = RedisConnection::get_from_redis(conn, LOCATIONS);
    let locations = serde_json::from_str::<Vec<LocationResponse>>(&locations).unwrap();

    HttpResponse::Ok().json(locations)
}

#[get("/location/{id}")]
pub async fn get_location_by_id(location: Data<Location>, id: Path<String>) ->impl
Responder {
    let location = location.get_location_by_id(id.clone()).await;

    HttpResponse::Ok().json(location)
}