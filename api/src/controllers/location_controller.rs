use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::location::Location;

#[get("/location")]
pub async fn get_locations(locations: Data<Location>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_locations = locations.get_locations(client, access_token).await;

    return HttpResponse::Ok()
        .json(found_locations)
}