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
    pub errorcode: i32,
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
        match self.errorcode {
            1000=> actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            1001=> actix_web::http::StatusCode::EXPECTATION_FAILED,
            1002=> actix_web::http::StatusCode::REQUEST_TIMEOUT,
            1003=> actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            1004=> actix_web::http::StatusCode::BAD_REQUEST,
            1005=> actix_web::http::StatusCode::BAD_REQUEST,
            1006=> actix_web::http::StatusCode::SERVICE_UNAVAILABLE,
            1007=> actix_web::http::StatusCode::BAD_REQUEST,
            1008=> actix_web::http::StatusCode::PRECONDITION_FAILED,
            2000=> actix_web::http::StatusCode::BAD_REQUEST,
            2001=> actix_web::http::StatusCode::FORBIDDEN,
            2002=> actix_web::http::StatusCode::FORBIDDEN,
            2003=>actix_web::http::StatusCode::UNAUTHORIZED,
            2004=> actix_web::http::StatusCode::FORBIDDEN,
            2005=> actix_web::http::StatusCode::FORBIDDEN,
            2006=> actix_web::http::StatusCode::CONFLICT,
            2007=> actix_web::http::StatusCode::UNAUTHORIZED,
            2008=> actix_web::http::StatusCode::FORBIDDEN,
            2009=> actix_web::http::StatusCode::UNAUTHORIZED,
            2010=> actix_web::http::StatusCode::FORBIDDEN,
            2011=> actix_web::http::StatusCode::FORBIDDEN,
            2012=> actix_web::http::StatusCode::FAILED_DEPENDENCY,
            2013=> actix_web::http::StatusCode::FORBIDDEN,

            _=> actix_web::http::StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

