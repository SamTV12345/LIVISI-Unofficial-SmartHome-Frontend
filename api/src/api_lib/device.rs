use std::collections::HashMap;
use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use serde_json::Value;
use crate::api_lib::capability::{CapValueType};
use crate::api_lib::location::{LocationResponse};
use crate::CLIENT_DATA;
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
pub struct DevicePost {
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
    pub state: HashMap<String,CapValueType>
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
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url:format!("{}{}", server_url, "/device")
        }
    }
   pub async fn get_devices(&self)  ->DeviceResponse{
       let locked_client = CLIENT_DATA.get().unwrap().lock();
       let response = locked_client.unwrap().client.get(self.base_url.clone())
           .headers(HeaderUtils::get_auth_token_header())
            .send()
            .await
            .unwrap();
        response.json::<DeviceResponse>()
            .await
            .unwrap()
    }


    pub async fn get_all_device_states(&self) ->DeviceStateResponse{
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone()+"/states")
            .send()
            .await
            .unwrap();
        response.json::<DeviceStateResponse>()
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
                        
                        response.text().await.unwrap()
                    },
                    _ => {
                        
                        response.text().await.unwrap()
                    }
                }
            },
            Err(e) => {
                
                e.to_string()
            }
        }
    }
}