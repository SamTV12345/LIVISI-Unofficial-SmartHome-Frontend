use reqwest::Client;

use crate::utils::header_utils::HeaderUtils;
use serde_derive::Serialize;
use serde_derive::Deserialize;

#[derive(Clone)]
pub struct User{
    pub base_url: String
}


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse{
    pub account_name: String,
    pub password: String,
    pub tenant_id: String,
    pub data:UserData
}


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserData {
    latest_ta_c_accepted: bool
}

impl User {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/user"
        }
    }

    pub async fn get_users(&self, client: Client, token: String) -> UserResponse {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<UserResponse>()
            .await
            .unwrap()
    }
}