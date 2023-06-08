use std::collections::HashMap;
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
    #[serde(skip_serializing_if = "Option::is_none")]
    class: Option<String>,
    namespace: String,
    timestamp: String,
    read: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    devices: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    messages: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    properties: Option<MessageProperties>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<HashMap<String,String>>
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