use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::capability::{Capability, CapabilityResponse};
use actix_web::get;
use diesel::row::NamedRow;
use crate::utils::connection::RedisConnection;
use redis::{Client as RedisClient, Commands, RedisResult};
use crate::constants::constants::CAPABILITIES;

#[get("/capability")]
pub async fn get_capabilties(mut redis_conn: Data<RedisClient>) -> impl
Responder {
    let capabilities = RedisConnection::get_from_redis(redis_conn.get_connection().unwrap(), CAPABILITIES);
    let capabilities = serde_json::from_str::<Vec<CapabilityResponse>>(&capabilities).unwrap();
    return HttpResponse::Ok()
        .json(capabilities);
}

#[get("/capability/states")]
pub async fn get_capability_states(capability_lib: Data<Capability>, token: Data<AppState>) -> impl
Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let capabilities = capability_lib.get_all_capability_states(client, access_token).await;
    return HttpResponse::Ok().json(capabilities);
}