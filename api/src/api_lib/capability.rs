use crate::api_lib::interaction::FieldValue;
use serde_derive::Deserialize;
use serde_derive::Serialize;

use crate::CLIENT_DATA;
use std::collections::HashMap;

#[derive(Clone)]
pub struct Capability {
    pub base_url: String,
    pub server_url: String,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct CapabilityResponse(pub Vec<CapabilityInner>);

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct CapabilityInner {
    pub id: String,
    pub r#type: String,
    pub device: String,
    pub config: CapabilityConfig,
}

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityConfig {
    pub activity_log_active: bool,
    pub name: String,
}

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct CapabilityStateResponse(pub Vec<CapabilityStateInner>);

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityStateInner {
    pub id: String,
    pub state: Option<HashMap<String, CapValueType>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CapabilityInnerVal {
    pub value: CapValueItem,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum CapValueType {
    CapabilityInnerVal(CapabilityInnerVal),
    CapValueItem(CapValueItem),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CapValueItem {
    pub value: Option<FieldValue>,
    pub last_changed: String,
}

#[derive(Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityTempData {
    event_type: String,
    event_time: String,
    data_name: String,
    data_value: String,
    entity_id: String,
}

impl Capability {
    pub fn new(server_url: &str) -> Self {
        Self {
            server_url: server_url.to_string(),
            base_url: format!("{}{}", server_url, "/capability"),
        }
    }

    pub async fn get_historic_data(
        &self,
        path: &str,
    ) -> Result<Vec<CapabilityTempData>, crate::api_lib::ApiError> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client
            .get(self.server_url.clone() + path)
            .send()
            .await?;

        crate::api_lib::parse_json::<Vec<CapabilityTempData>>(response).await
    }

    pub async fn get_capabilities(&self) -> Result<CapabilityResponse, crate::api_lib::ApiError> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client.get(self.base_url.clone()).send().await?;

        crate::api_lib::parse_json::<CapabilityResponse>(response).await
    }

    pub async fn get_all_capability_states(
        &self,
    ) -> Result<CapabilityStateResponse, crate::api_lib::ApiError> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client
            .get(self.base_url.clone() + "/states")
            .send()
            .await?;

        crate::api_lib::parse_json::<CapabilityStateResponse>(response).await
    }
}
