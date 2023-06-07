use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;

use crate::api_lib::hash::Hash;


#[get("/product/hash")]
pub async fn get_hash(hash_lib: Data<Hash>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let hash = hash_lib.get_hash(client, access_token).await;
    return HttpResponse::Ok()
        .json(hash);
}