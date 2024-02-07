use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;



use crate::api_lib::hash::Hash;


#[get("/product/hash")]
pub async fn get_hash(hash_lib: Data<Hash>) -> impl Responder{

    let hash = hash_lib.get_hash().await;
    HttpResponse::Ok()
        .json(hash)
}