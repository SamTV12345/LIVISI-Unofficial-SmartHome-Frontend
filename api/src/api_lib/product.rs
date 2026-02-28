use serde_json::Value;

use crate::utils::header_utils::HeaderUtils;
use crate::CLIENT_DATA;

#[derive(Clone)]
pub struct Product {
    pub base_url: String,
}

impl Product {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/product"),
        }
    }

    pub async fn get_products(&self) -> Value {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client
            .get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header())
            .send()
            .await
            .unwrap();
        response.json::<Value>().await.unwrap()
    }
}
