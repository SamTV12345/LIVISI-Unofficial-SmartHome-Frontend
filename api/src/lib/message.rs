use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct Message{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct MessageResponse{
    id: String,
    r#type: String,
    read: bool,
    class: String,
    timestamp: String,
    messages:Vec<String>,
    capabilities: Vec<String>,
    properties: MessageProperties
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MessageProperties{
    pub device_location:String,
    pub device_name:String,
    pub device_serial:String,
    pub namespace:String,
}

impl Message {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/message"
        }
    }

    pub async fn get_message(&self, client: Client, token: String) -> Vec<MessageResponse> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<Vec<MessageResponse>>()
            .await
            .unwrap()
    }
}