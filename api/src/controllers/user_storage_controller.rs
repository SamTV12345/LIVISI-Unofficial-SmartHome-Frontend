use actix_web::{HttpResponse, Responder};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;

use crate::api_lib::user_storage::UserStorage;
use actix_web::get;

#[get("/userstorage")]
pub async fn get_user_storage(users: Data<UserStorage>, token: Data<AppState>) -> impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let found_users = users.get_user_storage(client, access_token).await;

    return HttpResponse::Ok()
        .json(found_users)
}