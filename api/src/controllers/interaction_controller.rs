use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;

use crate::AppState;
use crate::api_lib::interaction::Interaction;

#[get("/interaction")]
pub async fn get_interactions(interaction_lib: Data<Interaction>, _token: Data<AppState>) -> impl
Responder {
    let response = interaction_lib.get_interaction().await;
    HttpResponse::Ok().json(response)
}