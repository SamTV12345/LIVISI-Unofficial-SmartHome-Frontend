use reqwest::Client;
use crate::lib::capability::CapabilityState;
use crate::utils::header_utils::HeaderUtils;
use serde::Serialize;
use serde::Deserialize;

#[derive(Clone)]
pub struct Action{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct ActionPost{
    pub id: String,
    pub r#type: String,
    pub namespace: String,
    pub target: String,
    pub params: ActionState
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActionPostResponse{
    pub r#type: String,
    pub result_code: String,
    pub target: String,
    pub namespace: String,
    pub properties: Vec<String>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase",)]
pub struct ActionState{
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remaining_quota: Option<IntegerCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<BooleanCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub on_state: Option<BooleanCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub humidity: Option<FloatCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mold_warning: Option<BooleanCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub point_temperature: Option<FloatCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_mode: Option<StringCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_reduction_active: Option<BooleanCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<FloatCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frost_warning: Option<BooleanCapabilityState>,
}


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IntegerCapabilityState{
    pub value: i32,
    pub r#type: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FloatCapabilityState{
    pub value: f32,
    pub r#type: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StringCapabilityState{
    pub value: String,
    pub r#type: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BooleanCapabilityState{
    pub value: bool,
    pub r#type: String,
}

impl Action {

    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/action"
        }
    }
    pub async fn post_action(&self, action: ActionPost, access_token: String, client: Client) -> ActionPostResponse
    {
        let response = client.post(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .json(&action)
            .send()
            .await
            .unwrap();
        response
            .json::<ActionPostResponse>()
            .await
            .unwrap()
    }
}
