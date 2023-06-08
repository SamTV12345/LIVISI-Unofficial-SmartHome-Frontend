use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::api_lib::interaction::{FieldValue};
use crate::utils::header_utils::HeaderUtils;
use std::collections::HashMap;

#[derive(Clone)]
pub struct Capability{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct CapabilityResponse(Vec<CapabilityInner>);

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct CapabilityInner{
    pub id: String,
    pub r#type: String,
    pub device: String,
    pub config: CapabilityConfig
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityConfig{
    pub activity_log_active: bool,
    pub name: String
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct CapabilityStateResponse(Vec<CapabilityStateInner>);

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityStateInner{
    pub id: String,
    pub state: HashMap<String,CapValueItem>
}


#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CapValueItem{
    pub value: FieldValue,
    pub last_changed: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IntegerCapabilityState{
    pub value: i32,
    pub last_changed: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FloatCapabilityState{
    pub value: f32,
    pub last_changed: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StringCapabilityState{
    pub value: String,
    pub last_changed: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BooleanCapabilityState{
    pub value: bool,
    pub last_changed: String
}

impl Capability{
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/capability"
        }
    }

    pub async fn get_capabilities(&self, client: Client, token: String) -> CapabilityResponse {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response
                .json::<CapabilityResponse>()
                .await
                .unwrap()
    }




    pub async fn get_all_capability_states(&self, client: Client, token: String) -> CapabilityStateResponse {
        let response = client.get(self.base_url.clone()+"/states")
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response
                .json::<CapabilityStateResponse>()
                .await
                .unwrap()
    }
}