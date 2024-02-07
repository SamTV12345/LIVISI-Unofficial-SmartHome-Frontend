use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;


use crate::api_lib::relationship::Relationship;
use actix_web::get;

#[get("/relationship")]
pub async fn get_relationship(relationship_lib: Data<Relationship>) -> impl
Responder {

    let home_setup = relationship_lib.get_relationship().await;

    HttpResponse::Ok().json(home_setup)
}