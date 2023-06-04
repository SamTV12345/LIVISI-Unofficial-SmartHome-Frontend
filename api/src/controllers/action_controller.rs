use actix_web::{HttpResponse, Responder, web};
use actix_web::web::Data;
use reqwest::Client;
use crate::AppState;
use crate::lib::action::{Action, ActionPost};
use actix_web::post;

#[post("/action")]
pub async fn post_action(action_lib: Data<Action>,action: web::Json<ActionPost>, token:
Data<AppState>)->impl Responder{
    let client = Client::new();
    let access_token = token.token.lock().unwrap().access_token.clone();

    let result = action_lib.post_action(action.into_inner(), access_token, client).await;

    HttpResponse::Ok().json(result)
}