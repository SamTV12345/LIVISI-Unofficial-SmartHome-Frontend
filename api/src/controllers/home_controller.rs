use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::api_lib::home::Home;
use actix_web::get;
#[get("/home/setup")]
pub async fn get_home_setup(home: Data<Home>, token: Data<AppState>) -> impl Responder {
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let home_setup = home.get_home_setup(client, access_token).await;

    return HttpResponse::Ok().json(home_setup);
}