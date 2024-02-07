use std::fmt::{Display, Formatter};
use actix_web::ResponseError;
use serde_derive::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum LivisResponseType<T> {
    Ok(T),
    Err(ErrorConstruct)
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct ErrorConstruct {
    pub errorcode: String,
    pub description: String,
    pub messages: Vec<String>,
}

impl Display for ErrorConstruct {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "ErrorConstruct: errorcode: {}, description: {}, messages: {:?}", self.errorcode, self.description, self.messages)
    }
}

impl ResponseError for ErrorConstruct {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match self.errorcode.as_str() {
            "1005" => actix_web::http::StatusCode::BAD_REQUEST,
            "401" => actix_web::http::StatusCode::UNAUTHORIZED,
            "403" => actix_web::http::StatusCode::FORBIDDEN,
            "404" => actix_web::http::StatusCode::NOT_FOUND,
            "500" => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            _ => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

