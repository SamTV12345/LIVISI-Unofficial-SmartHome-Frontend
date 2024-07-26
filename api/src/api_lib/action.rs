use std::collections::HashMap;


use serde::Serialize;
use serde::Deserialize;
use serde_json::Value;
use crate::api_lib::interaction::ValueItem;
use crate::api_lib::livisi_response_type::{LivisResponseType};
use crate::CLIENT_DATA;

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

    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/action")
        }
    }
    pub async fn post_action(&self, action: ActionPost) -> LivisResponseType<ActionPostResponse>
    {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.post(self.base_url.clone())
            .json(&action)
            .send()
            .await
            .unwrap();
        response
            .json::<LivisResponseType<ActionPostResponse>>()
            .await
            .unwrap()
    }
}
