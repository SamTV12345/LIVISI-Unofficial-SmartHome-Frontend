use std::collections::HashMap;
use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use serde_json::Value;
use crate::api_lib::capability::CapValueItem;
use crate::api_lib::location::{LocationResponse};

use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct Device{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceResponse(pub Vec<DevicePost>);

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateResponse(Vec<DeviceState>);


#[derive(Default,Serialize,Deserialize, Debug,Clone)]
#[serde(rename_all = "camelCase")]
pub struct DevicePost{
    pub manufacturer: String,
    pub r#type: String,
    pub version: String,
    pub product: String,
    pub serial_number: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location:Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<DeviceConfig>,
    pub volatile: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Value>,
    // Only required in the location
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location_data: Option<LocationResponse>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceState{
    pub id: String,
    pub state: HashMap<String,CapValueItem>
}


#[derive(Default,Serialize,Deserialize, Debug,Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceTags{
    pub internal_state_id: Option<String>
}

#[derive(Default,Serialize,Deserialize, Debug,Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfig{
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activity_log_active: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub friendly_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_id: Option<String>,
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_of_acceptance: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_of_discovery: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub underlying_device_ids: Option<String>,
    pub paired_since: Option<String>,
}


impl Device {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/device"
        }
    }
   pub async fn get_devices(&self, client: Client, access_token: String)  ->DeviceResponse{
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .send()
            .await
            .unwrap();
        return  response.json::<DeviceResponse>()
            .await
            .unwrap()
    }


    pub async fn get_all_device_states(&self, client: Client, access_token: String) ->DeviceStateResponse{
        let response = client.get(self.base_url.clone()+"/states")
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .send()
            .await
            .unwrap();
        return  response.json::<DeviceStateResponse>()
            .await
            .unwrap()
    }


    pub async fn post_status(&self, client: Client, device_post:DevicePost) -> String {
        let response = client.post(self.base_url.clone())
            .json::<DevicePost>(&device_post)
            .send()
            .await;
        match response {
            Ok(response) => {
                match response.status().as_u16() {
                    200 => {
                        let response = response.text().await.unwrap();
                        response
                    },
                    _ => {
                        let response = response.text().await.unwrap();
                        response
                    }
                }
            },
            Err(e) => {
                let response = e.to_string();
                response
            }
        }
    }
}