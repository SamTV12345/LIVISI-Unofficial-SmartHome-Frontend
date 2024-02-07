use std::collections::HashMap;


use serde::{Serialize};
use serde::Deserialize;
use serde_json::Value;
use crate::CLIENT_DATA;


#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Interaction{
    pub base_url: String,
}

#[derive(Serialize,Deserialize, Debug, Clone)]
pub enum InteractionType {
Add, Subtract, Multiply, Divide,Modulo, Equal, NotEqual, Smaller,Greater,
SmallerOrEqual, GreaterOrEqual, And, Or, Min, Max,Pow, Exp,
Log, Abs, Round,
GetEntityStateProperty,
GetEventProperty, BitwiseAnd, BitwiseOr, BitwiseXOR, BitwiseNot,
BitwiseLeftShift, BitwiseRightShift, GetMinute, GetHour, GetDayOfWeek, GetDayOfMonth,
GetWeekdayOfMonth, GetMonth, GetYear, GetDayOfCentury, GetWeekOfCentury, GetMonthOfCentury,
GetCurrentDateTime, Average, InBetween, GetMinuteOfDay, GetMinutesSinceLastChange,
MemberInArea, MemberNotInArea
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionResponse{
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub created: String,
    pub modified: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub valid_from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub valid_to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub freeze_time: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_internal: Option<bool>,
    pub rules: Vec<InteractionRule>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<HashMap<String,String>>
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Details {}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum FieldValue {
    StringValue(String),
    BooleanValue(bool),
    IntegerValue(i32),
    FloatValue(f32),
    Struct(Details)
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionRule{
    id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    condition_evaluation_delay: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    triggers: Option<Vec<Triggers>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    constraints: Option<Vec<ValueItem>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    actions: Option<Vec<InteractionAction>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<HashMap<String,String>>
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
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<String>,
    r#type: String,
    namespace: String,
    target: String,
    params: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<HashMap<String, String>>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Triggers{
    r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    event_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    subtype: Option<String>,
    source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    namespace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    properties: Option<HashMap<String,FieldValue>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    conditions: Option<Vec<InteractionCondition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<HashMap<String, String>>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionCondition{
    r#type: InteractionType,
    params: Value, // Fix me
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<HashMap<String, String>>
}

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionActionParam(HashMap<String, String>);

#[derive(Serialize,Deserialize, Debug, Clone)]
pub struct InteractionConditionParam(HashMap<String, ValueItem>);

#[derive(Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InteractionParamParam(HashMap<String, ValueItem>);

impl Interaction{
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/interaction"
        }
    }

    pub async fn get_interaction(&self) -> Vec<InteractionResponse> {
        let locked_client = CLIENT_DATA.get().unwrap().lock();

        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<Vec<InteractionResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_interaction_by_id(&self, id:String) ->
                                                                        InteractionResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();

        let response = locked_client.unwrap().client.get(self.base_url.clone()+"/"+&id)
            .send()
            .await
            .unwrap();

        response.json::<InteractionResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_interaction_by_id(&self, id:String) ->
    InteractionResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();

        let response = locked_client.unwrap().client.delete(self.base_url.clone()+"/"+&id)
            .send()
            .await
            .unwrap();

        response.json::<InteractionResponse>()
            .await
            .unwrap()
    }
}
