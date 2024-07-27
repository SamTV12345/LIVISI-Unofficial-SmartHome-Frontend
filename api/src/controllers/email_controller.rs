use actix_web::{get, HttpResponse, HttpResponseBuilder, put, Responder, Scope, web};
use actix_web::http::StatusCode;
use actix_web::web::Data;
use crate::api_lib::email::{Email, EmailAPI};
use crate::STORE_DATA;

#[get("/settings")]
pub async fn get_email_settings(email_lib: Data<Email>) -> impl Responder {
    let email = email_lib.get_email_settings().await;
    HttpResponse::Ok().json(email)
}

#[put("/settings")]
pub async fn update_email_settings(email_lib: Data<Email>, email_data: web::Json<EmailAPI>) -> impl Responder {
    let email_data = email_data.into_inner();
    let status = email_lib.update_email_settings(&email_data).await;
    {
        let st = STORE_DATA.get().unwrap();
        let mut store = st.data.lock().unwrap();
        store.email = Some(email_data);
    }
    HttpResponseBuilder::new(StatusCode::try_from(status).unwrap()).finish()
}


#[get("/test")]
pub async fn test_email(email_lib: Data<Email>) -> impl Responder {
    let email = email_lib.test_email().await;
    HttpResponse::Ok().json(email)
}

pub fn get_email_routes() -> Scope {
        Scope::new("/email")
            .service(get_email_settings)
            .service(update_email_settings)
            .service(test_email)
}