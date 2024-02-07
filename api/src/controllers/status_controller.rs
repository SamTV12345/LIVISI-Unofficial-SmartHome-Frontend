
use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;


use crate::api_lib::status::Status;


#[get("/status")]
pub async fn get_status(status_lib:Data<Status>) -> impl Responder{
    let response = status_lib.get_status().await;
    HttpResponse::Ok()
        .json(response)
}