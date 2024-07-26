use base64::Engine;
use base64::engine::general_purpose;
use reqwest::header::{AUTHORIZATION, HeaderMap};
use crate::STORE_DATA;

pub struct HeaderUtils;


impl HeaderUtils{
    pub fn get_headers()->HeaderMap{
        let mut map = HeaderMap::new();
        let auth_string = "clientId:clientPass";
        let b64_auth = general_purpose::STANDARD.encode(auth_string);
        map.insert(AUTHORIZATION, ("Basic ".to_owned() + &b64_auth).parse().unwrap());
        map
    }

    pub fn get_auth_token_header()->HeaderMap{
        let mut map = HeaderMap::new();
        let token = STORE_DATA.get().unwrap().token.lock().unwrap();

        map.append("Accept", "application/json".parse().unwrap());
        map.insert("Authorization", format!("Bearer {}",token.access_token).parse().unwrap());

        map
    }
}