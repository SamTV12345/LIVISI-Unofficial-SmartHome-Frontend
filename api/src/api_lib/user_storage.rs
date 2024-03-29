use reqwest::Client;
use serde_json::Value;


use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct UserStorage{
    pub base_url: String,
}


impl UserStorage {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/userstorage"
        }
    }

    pub async fn get_user_storage(&self, client: Client, token: String) -> Vec<Value> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<Vec<Value>>()
            .await
            .unwrap()
    }
}