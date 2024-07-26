use actix_web::{HttpResponse, Responder};




use actix_web::get;
use crate::STORE_DATA;

#[get("/userstorage")]
pub async fn get_user_storage() -> impl Responder{
    let user_storage = &STORE_DATA.get().unwrap().data.lock().unwrap().user_storage;
    HttpResponse::Ok()
        .json(user_storage)
}