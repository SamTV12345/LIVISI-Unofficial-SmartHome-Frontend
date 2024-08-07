


use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;

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
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/user")
        }
    }

    pub async fn get_users(&self) -> UserResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<UserResponse>()
            .await
            .unwrap()
    }
}