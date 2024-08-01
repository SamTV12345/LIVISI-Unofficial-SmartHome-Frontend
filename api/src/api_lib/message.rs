use std::collections::HashMap;
use reqwest::{Response};
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;
use crate::controllers::message_controller::MessageRead;

#[derive(Clone)]
pub struct Message{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
pub struct MessageResponse{
    pub id: String,
    pub  r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub  class: Option<String>,
    pub  namespace: Option<String>,
    pub  timestamp: String,
    pub  read: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub devices: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub messages: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<MessageProperties>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<HashMap<String,String>>
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MessageProperties{
    pub device_location: Option<String>,
    pub device_name: Option<String>,
    pub device_serial: Option<String>,
    pub namespace: Option<String>,
    pub requester_info: Option<String>,
    pub shc_remote_reboot_reason: Option<String>,
    pub read: Option<bool>,
    pub change_reason: Option<String>,
    pub expires_after_minutes: Option<i32>,
    pub timestamp: Option<String>
}

impl Message {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: server_url.to_string() +"/message"
        }
    }

    pub async fn get_messages(&self) -> Vec<MessageResponse> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<Vec<MessageResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_message_by_id(&self, message_id: String) -> MessageResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.get(self.base_url.clone()+ &format!("/{}", message_id))
            .send()
            .await
            .unwrap();

            response.json::<MessageResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_message_by_id(&self, message_id: String)
        -> Response {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        api_client.delete(self.base_url.clone()+&format!("/{}",message_id))
            .send()
            .await
            .unwrap()
    }

    pub async fn update_mesage_read(&self, message_id: String, read: MessageRead)
                                    -> Response {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        api_client.put(self.base_url.clone()+&format!("/{}",message_id))
            .json(&read)
            .send()
            .await
            .unwrap()
    }
}