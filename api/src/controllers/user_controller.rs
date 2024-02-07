use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;


use crate::api_lib::user::User;


#[get("/users")]
pub async fn get_users(users: Data<User>) -> impl Responder{

    let found_users = users.get_users().await;

    HttpResponse::Ok().json(found_users)
}