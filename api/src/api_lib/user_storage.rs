use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use crate::CLIENT_DATA;
use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct UserStorage{
    pub base_url: String,
}

#[derive(Serialize,Deserialize, Debug, Clone)]
pub struct UserStorageResponse(pub Vec<Value>);

impl UserStorage {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}",server_url, "/userstorage")
        }
    }

    pub async fn get_user_storage(&self) -> UserStorageResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header())
            .send()
            .await
            .unwrap();

            response.json::<UserStorageResponse>()
            .await
            .unwrap()
    }
}