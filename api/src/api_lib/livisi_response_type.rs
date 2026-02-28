use std::fmt::{Display, Formatter};
use axum::http::StatusCode;
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

impl ErrorConstruct {
    pub fn status_code(&self) -> StatusCode {
        match self.errorcode {
            1000=> StatusCode::INTERNAL_SERVER_ERROR,
            1001=> StatusCode::EXPECTATION_FAILED,
            1002=> StatusCode::REQUEST_TIMEOUT,
            1003=> StatusCode::INTERNAL_SERVER_ERROR,
            1004=> StatusCode::BAD_REQUEST,
            1005=> StatusCode::BAD_REQUEST,
            1006=> StatusCode::SERVICE_UNAVAILABLE,
            1007=> StatusCode::BAD_REQUEST,
            1008=> StatusCode::PRECONDITION_FAILED,
            2000=> StatusCode::BAD_REQUEST,
            2001=> StatusCode::FORBIDDEN,
            2002=> StatusCode::FORBIDDEN,
            2003=> StatusCode::UNAUTHORIZED,
            2004=> StatusCode::FORBIDDEN,
            2005=> StatusCode::FORBIDDEN,
            2006=> StatusCode::CONFLICT,
            2007=> StatusCode::UNAUTHORIZED,
            2008=> StatusCode::FORBIDDEN,
            2009=> StatusCode::UNAUTHORIZED,
            2010=> StatusCode::FORBIDDEN,
            2011=> StatusCode::FORBIDDEN,
            2012=> StatusCode::FAILED_DEPENDENCY,
            2013=> StatusCode::FORBIDDEN,
            _=> StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

