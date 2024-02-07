use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;


use crate::api_lib::home::Home;
use actix_web::get;
#[get("/home/setup")]
pub async fn get_home_setup(home: Data<Home>) -> impl Responder {
    let home_setup = home.get_home_setup().await;

    HttpResponse::Ok().json(home_setup)
}