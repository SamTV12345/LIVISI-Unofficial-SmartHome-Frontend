use reqwest::ClientBuilder;
use reqwest::header::HeaderValue;
use crate::utils::header_utils::HeaderUtils;

pub struct ClientData {
    pub client: reqwest::Client,
    pub token: String,
}

impl ClientData {
    pub fn new(token: String) -> Self {
        let mut map = HeaderUtils::get_auth_token_header(token.clone());
        map.append("Accept", HeaderValue::from_str("application/json").unwrap());
        let client = ClientBuilder::new()
            .default_headers(map)
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
            .build().unwrap();

        ClientData {
            client,
            token,
        }
    }
}