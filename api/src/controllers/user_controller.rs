use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::user::User;


#[get("/users")]
pub async fn get_users(users: Data<User>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_users = users.get_users(client, access_token).await;

    return HttpResponse::Ok().json(found_users)
}