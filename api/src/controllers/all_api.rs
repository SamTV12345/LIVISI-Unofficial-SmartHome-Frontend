use actix_web::{get, HttpResponse, Responder};
use crate::STORE_DATA;

#[get("/api/all")]
pub async fn get_all_api() ->impl Responder {
    let store = STORE_DATA.get().unwrap();
    let data = store.data.lock().unwrap();
    HttpResponse::Ok()
        .json(data.clone())
}