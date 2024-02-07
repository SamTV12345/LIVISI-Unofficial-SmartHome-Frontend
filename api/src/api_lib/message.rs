use std::collections::HashMap;
use reqwest::{Client, Response};
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
    namespace: Option<String>,
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
    pub device_location: Option<String>,
    pub device_name: Option<String>,
    pub device_serial: Option<String>,
    pub namespace: Option<String>,
    pub requester_info: Option<String>,
    pub shc_remote_reboot_reason: Option<String>,
    pub read: Option<bool>,
}

impl Message {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/message"
        }
    }

    pub async fn get_messages(&self, client: Client, token: String) -> Vec<MessageResponse> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<Vec<MessageResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_message_by_id(&self, client: Client, token: String, message_id: String) -> MessageResponse {
        let response = client.get(self.base_url.clone()+ &format!("/{}", message_id))
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<MessageResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_message_by_id(&self, client: Client, token: String, message_id: String)
        -> Response {
        client.delete(self.base_url.clone()+&format!("/{}",message_id))
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap()
    }

    pub async fn update_mesage_read(&self, client: Client, token: String, message_id: String)
        -> Response {
        client.put(self.base_url.clone()+&format!("/{}",message_id))
            .body("{\"read\":true}")
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap()
    }
}