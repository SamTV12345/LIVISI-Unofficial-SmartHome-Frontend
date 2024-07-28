use actix_web::{get, HttpRequest, HttpResponse, Responder, Scope};
use actix_web::web::Data;
use path_clean::clean;
use crate::api_lib::capability::Capability;

#[get("/capability")]
pub async fn get_capabilities_temperature(cap_lib: Data<Capability>, req: HttpRequest) -> impl
Responder {
    let path = req.uri().path();
    let query = req.uri().query().unwrap_or("");
    let full_url = if query.is_empty() {
        path.to_string()
    } else {
        format!("{}?{}", path, query)
    };
    let cleaned_url = clean(&full_url);
    if !cleaned_url.starts_with("/data") {
        return HttpResponse::BadRequest().body("Invalid URL");
    }

    let response = cap_lib.get_historic_data(&full_url).await;
    HttpResponse::Ok().json(response)
}


pub fn get_capability_routes() -> Scope {
    Scope::new("/data")
        .service(get_capabilities_temperature)
}