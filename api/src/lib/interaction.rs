use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde::Serialize;
use serde::Deserialize;
use crate::lib::action::{IntegerCapabilityState, StringCapabilityState};
use crate::lib::capability::BooleanCapabilityState;

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Interaction{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionResponse{
    pub id: String,
    pub modified: String,
    pub created: String,
    pub freeze_time: i32,
    pub is_internal: bool,
    pub name: String,
    pub rules: Vec<InteractionRule>,
}

//#[derive(Default,Serialize,Deserialize, Debug, Clone)]
//#[serde(rename_all = "camelCase")]
pub struct InteractionRule{
    id: String,
    conditions_evaluation_delay:i32,
    constraints: Vec<InteractionConstraint>,
    triggers: Vec<Triggers>,
    actions: Vec<InteractionAction>
}

pub struct InteractionConstraint{
}

pub struct InteractionAction{
    r#type: String,
    params: Vec<InteractionActionParam>,
    id: String,
    namespace: String,
    target: String
}

pub struct Triggers{
    r#type: String,
    event_type: String,
    source: String,
    conditions: Vec<InteractionCondition>
}

pub struct InteractionCondition{
    r#type: String,
    params: Vec<InteractionConditionParam>
}

pub struct InteractionActionParam{
    #[serde(skip_serializing_if = "Option::is_none")]
    switch_off_delay_time: Option<IntegerCapabilityState>,
    #[serde(skip_serializing_if = "Option::is_none")]
    switch_on_delay_time: Option<IntegerCapabilityState>,
    pub on_state: Option<BooleanCapabilityState>,
}

pub struct InteractionConditionParam{
    pub left_op: InteractionParam,
    pub right_op: StringCapabilityState
}

pub struct InteractionParam {
    r#type: String,
    params: InteractionParamParam
}

pub struct InteractionParamParam{
    event_property_name: StringCapabilityState
}

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