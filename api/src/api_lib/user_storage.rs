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
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/userstorage"
        }
    }

    pub async fn get_user_storage(&self) -> UserStorageResponse {
        let mut locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header())
            .send()
            .await
            .unwrap();

            response.json::<UserStorageResponse>()
            .await
            .unwrap()
    }
}