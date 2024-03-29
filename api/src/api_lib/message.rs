use std::collections::HashMap;
use reqwest::{Response};
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;


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

    pub async fn get_messages(&self) -> Vec<MessageResponse> {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<Vec<MessageResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_message_by_id(&self, message_id: String) -> MessageResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone()+ &format!("/{}", message_id))
            .send()
            .await
            .unwrap();

            response.json::<MessageResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_message_by_id(&self, message_id: String)
        -> Response {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        locked_client.unwrap().client.delete(self.base_url.clone()+&format!("/{}",message_id))
            .send()
            .await
            .unwrap()
    }

    pub async fn update_mesage_read(&self, message_id: String)
        -> Response {
        let locked_client = CLIENT_DATA.get().unwrap().lock();

        locked_client.unwrap().client.put(self.base_url.clone()+&format!("/{}",message_id))
            .body("{\"read\":true}")
            .send()
            .await
            .unwrap()
    }
}