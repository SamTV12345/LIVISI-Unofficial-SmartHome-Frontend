use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;

use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct Status{
    base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse{
    pub serial_number: String,
    pub connected: bool,
    pub app_version: String,
    pub os_version: String,
    pub config_version: String,
    pub controller_type: String
}

impl Status {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/status"
        }
    }
   pub async fn get_status(&self, client: Client, token: String) -> StatusResponse {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await.unwrap();

            response.json::<StatusResponse>()
            .await
            .unwrap()
    }
}