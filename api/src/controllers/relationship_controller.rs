use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::relationship::Relationship;
use actix_web::get;

#[get("/relationship")]
pub async fn get_relationship(relationship_lib: Data<Relationship>, token: Data<AppState>) -> impl
Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let home_setup = relationship_lib.get_relationship(client, access_token).await;

    return HttpResponse::Ok().json(home_setup);
}