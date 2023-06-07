use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::location::{Location, LocationResponse};
use crate::utils::connection::RedisConnection;
use redis::{Client as RedisClient, Connection};
use crate::constants::constants::LOCATIONS;

#[get("/location")]
pub async fn get_locations(redis: Data<RedisClient>) -> impl Responder{
    let conn = redis.get_connection().unwrap();
    let locations = RedisConnection::get_from_redis(conn, LOCATIONS);
    let locations = serde_json::from_str::<Vec<LocationResponse>>(&locations).unwrap();

    return HttpResponse::Ok().json(locations)
}