use axum::http::StatusCode;
use serde_derive::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum LivisResponseType<T> {
    Ok(T),
    Err(ErrorConstruct),
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct ErrorConstruct {
    pub errorcode: i32,
    pub description: String,
    pub messages: Vec<String>,
}

impl Display for ErrorConstruct {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "ErrorConstruct: errorcode: {}, description: {}, messages: {:?}",
            self.errorcode, self.description, self.messages
        )
    }
}

impl ErrorConstruct {
    /// Maps a LIVISI error code to an HTTP status. The catalog follows the
    /// openHAB livisismarthome binding's `ErrorResponseDTO` (codes 1000–6002).
    pub fn status_code(&self) -> StatusCode {
        match self.errorcode {
            // General
            1000 => StatusCode::INTERNAL_SERVER_ERROR,
            1001 => StatusCode::SERVICE_UNAVAILABLE,
            1002 => StatusCode::REQUEST_TIMEOUT,
            1003 => StatusCode::INTERNAL_SERVER_ERROR,
            1004 => StatusCode::BAD_REQUEST,
            1005 => StatusCode::BAD_REQUEST,
            1006 => StatusCode::SERVICE_UNAVAILABLE,
            1007 => StatusCode::BAD_REQUEST,
            1008 => StatusCode::PRECONDITION_FAILED,
            // Authentication / authorization
            2000 => StatusCode::BAD_REQUEST,
            2001 => StatusCode::FORBIDDEN,
            2002 => StatusCode::FORBIDDEN,
            2003 => StatusCode::UNAUTHORIZED,
            2004 => StatusCode::FORBIDDEN,
            2005 => StatusCode::FORBIDDEN,
            2006 => StatusCode::CONFLICT,
            2007 => StatusCode::UNAUTHORIZED,
            2008 => StatusCode::FORBIDDEN,
            2009 => StatusCode::UNAUTHORIZED,
            2010 => StatusCode::FORBIDDEN,
            2011 => StatusCode::FORBIDDEN,
            2012 => StatusCode::FAILED_DEPENDENCY,
            2013 => StatusCode::FORBIDDEN,
            // Entities
            3000 => StatusCode::NOT_FOUND,
            3001 => StatusCode::BAD_REQUEST,
            3002 => StatusCode::CONFLICT,
            3003 => StatusCode::CONFLICT,
            3004 => StatusCode::BAD_REQUEST,
            // Products
            3500 => StatusCode::FORBIDDEN,
            3501 => StatusCode::FORBIDDEN,
            // Actions
            4000 => StatusCode::BAD_REQUEST,
            4001 => StatusCode::BAD_REQUEST,
            4002 => StatusCode::FORBIDDEN,
            4003 => StatusCode::BAD_REQUEST,
            // Configuration
            5000 => StatusCode::INTERNAL_SERVER_ERROR,
            5001 => StatusCode::CONFLICT,
            5002 => StatusCode::BAD_GATEWAY,
            5003 => StatusCode::FORBIDDEN,
            5004 => StatusCode::CONFLICT,
            5005 => StatusCode::FORBIDDEN,
            5006 => StatusCode::SERVICE_UNAVAILABLE,
            5009 => StatusCode::INTERNAL_SERVER_ERROR,
            // Smart codes
            6000 => StatusCode::FORBIDDEN,
            6001 => StatusCode::BAD_REQUEST,
            6002 => StatusCode::FORBIDDEN,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
