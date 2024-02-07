use actix_web::http::header::{AUTHORIZATION, HeaderValue};
use base64::Engine;
use base64::engine::general_purpose;
use reqwest::header::HeaderMap;

pub struct HeaderUtils;


impl HeaderUtils{
    pub fn get_headers()->HeaderMap{
        let mut map = HeaderMap::new();
        let auth_string = "clientId:clientPass";
        let b64_auth = general_purpose::STANDARD.encode(auth_string);
        map.append(AUTHORIZATION, ("Basic ".to_owned() + &b64_auth).parse().unwrap());
        map
    }

    pub fn get_auth_token_header(token:String)->HeaderMap{
        let mut map = HeaderMap::new();

        map.append(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}",token)
        ).unwrap());
        map
    }
}