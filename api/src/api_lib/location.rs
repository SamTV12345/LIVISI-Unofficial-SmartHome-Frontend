use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::api_lib::device::DevicePost;

#[derive(Clone)]
pub struct Location{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocationResponse{
    pub config: LocationConfig,
    pub id:String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub devices: Option<Vec<DevicePost>>
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocationConfig{
    name: String,
    r#type: String
}

impl Location {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/location"
        }
    }

    pub async fn get_locations(&self, client: Client, token: String) -> Vec<LocationResponse> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response
                .json::<Vec<LocationResponse>>()
            .await
            .unwrap()
    }
}