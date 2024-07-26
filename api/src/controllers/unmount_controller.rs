use actix_web::{get, HttpResponse, Responder};
use actix_web::web::Data;
use crate::api_lib::unmount_service::USBService;
use crate::AppState;

#[get("/unmount")]
pub async fn unmount_usb_storage(usb_service: Data<USBService>, token: Data<AppState>) -> impl Responder {
    let token = token.token.lock().unwrap().access_token.clone();
    log::info!("{token}");
    usb_service.unmount_usb_storage().await;
    HttpResponse::Ok().body("USB storage unmounted.")
}


#[get("/usb_storage")]
pub async fn get_usb_status(usb_service: Data<USBService>, token: Data<AppState>) -> impl Responder {
    let _token = token.token.lock().unwrap().access_token.clone();
    let usb_status = usb_service.get_usb_status().await;
    HttpResponse::Ok().json(usb_status)
}