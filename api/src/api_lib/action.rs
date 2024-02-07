use std::collections::HashMap;
use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde::Serialize;
use serde::Deserialize;
use serde_json::Value;
use crate::api_lib::interaction::ValueItem;
use crate::api_lib::livisiresponse_type::{ErrorConstruct, LivisResponseType};

#[derive(Clone)]
pub struct Action{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct ActionPost{
    pub r#type: String,
    pub namespace: String,
    pub target: String,
    pub params: HashMap<String, ValueItem>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActionPostResponse{
    pub r#type: String,
    pub namespace: String,
    pub desc: String,
    pub target: String,
    pub properties: Value,
    pub result_code: String,
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
    pub async fn post_action(&self, action: ActionPost, access_token: String, client: Client) -> Result<ActionPostResponse, ErrorConstruct>
    {
        let response = client.post(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .json(&action)
            .send()
            .await
            .unwrap();
        response
            .json::<Result<ActionPostResponse, ErrorConstruct>>()
            .await
            .unwrap()
    }
}
