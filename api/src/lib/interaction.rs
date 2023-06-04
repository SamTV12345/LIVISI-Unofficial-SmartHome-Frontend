use std::collections::HashMap;
use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde::Serialize;
use serde::Deserialize;
use crate::lib::action::{IntegerCapabilityState, StringCapabilityState};
use crate::lib::capability::BooleanCapabilityState;

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Interaction{
    pub base_url: String,
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionResponse{
    pub id: String,
    pub name: Option<String>,
    pub created: String,
    pub modified: String,
    pub valid_from: Option<String>,
    pub valid_to: Option<String>,
    pub freeze_time: Option<i32>,
    pub is_internal: Option<bool>,
    pub rules: Vec<InteractionRule>,
    pub tags: HashMap<String,String>
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum FieldValue {
    StringValue(String),
    BooleanValue(bool),
    IntegerValue(i32),
    FloatValue(f32),
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionRule{
    id: String,
    conditions_evaluation_delay: Option<i32>,
    constraints: Option<Vec<ValueItem>>,
    triggers: Option<Vec<Triggers>>,
    actions: Option<Vec<InteractionAction>>,
    tags: Option<Vec<HashMap<String,String>>>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ValueItem{
    pub r#type: String,
    pub value: FieldValue
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionAction{
    r#type: String,
    params: Option<Vec<InteractionActionParam>>,
    id: Option<String>,
    namespace: String,
    target: String,
    tags: Vec<HashMap<String, String>>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Triggers{
    r#type: String,
    event_type: String,
    source: String,
    conditions: Vec<InteractionCondition>,
    tags: HashMap<String, String>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionCondition{
    r#type: String,
    params: Vec<InteractionConditionParam>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionActionParam(HashMap<String, ValueItem>);

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionConditionParam(HashMap<String, ValueItem>);

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionParam {
    r#type: String,
    params: InteractionParamParam
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionParamParam(HashMap<String, ValueItem>);

impl Interaction{
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/interaction"
        }
    }

    pub async fn get_interaction(&self, client: Client, token: String) -> Vec<InteractionResponse> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<Vec<InteractionResponse>>()
            .await
            .unwrap()
    }
}