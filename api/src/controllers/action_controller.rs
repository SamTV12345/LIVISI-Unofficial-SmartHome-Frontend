use actix_web::{HttpResponse, web};
use actix_web::web::Data;

use crate::AppState;
use crate::api_lib::action::{Action, ActionPost};
use actix_web::post;
use crate::api_lib::livisi_response_type::LivisResponseType;

#[post("/action")]
pub async fn post_action(action_lib: Data<Action>,action: web::Json<ActionPost>, _token:
Data<AppState>)-> Result<HttpResponse, crate::api_lib::livisi_response_type::ErrorConstruct>{

    let result = action_lib.post_action(action.into_inner()).await;

    match result {
        LivisResponseType::Ok(result) => Ok(HttpResponse::Ok().json(result)),
        LivisResponseType::Err(err) => Err(err)
    }
}