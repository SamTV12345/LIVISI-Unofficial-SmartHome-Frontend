use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::api_lib::interaction::Interaction;

#[get("/interaction")]
pub async fn get_interactions(interaction_lib: Data<Interaction>, token: Data<AppState>) -> impl
Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();
    let response = interaction_lib.get_interaction(client, access_token).await;
    return HttpResponse::Ok().json(response);
}