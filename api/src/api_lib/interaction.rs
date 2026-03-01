use std::collections::HashMap;

use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Value};
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
    pub tags: Option<HashMap<String,String>>,
    #[serde(flatten, default)]
    pub extra: HashMap<String, Value>
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
    Struct(Details),
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
    pub value: Option<FieldValue>
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
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/interaction")
        }
    }

    pub async fn get_interaction(&self) -> Vec<InteractionResponse> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<Vec<InteractionResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_interaction_by_id(&self, id:String) ->
                                                                        InteractionResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client.get(self.base_url.clone()+"/"+&id)
            .send()
            .await
            .unwrap();

        response.json::<InteractionResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_interaction_by_id(&self, id:String) ->
    InteractionResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client.delete(self.base_url.clone()+"/"+&id)
            .send()
            .await
            .unwrap();

        response.json::<InteractionResponse>()
            .await
            .unwrap()
    }

    pub async fn update_interaction_by_id(&self, id: String, interaction_data: Value) -> Result<Value, String> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let response = api_client
            .put(self.base_url.clone() + "/" + &id)
            .json(&interaction_data)
            .send()
            .await
            .map_err(|err| format!("Could not update interaction: {}", err))?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|err| format!("Could not read interaction update response: {}", err))?;

        if !status.is_success() {
            return Err(format!("Interaction update failed with status {}: {}", status, text));
        }

        serde_json::from_str::<Value>(&text)
            .map_err(|err| format!("Could not parse interaction update response JSON: {}", err))
    }

    pub async fn trigger_interaction(&self, id: String) -> Result<Value, String> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        let mut errors: Vec<String> = Vec::new();

        let direct_candidates = vec![
            self.base_url.clone() + "/" + &id + "/trigger",
            self.base_url.clone() + "/" + &id + "/execute"
        ];

        for endpoint in direct_candidates {
            match api_client.post(endpoint.clone()).send().await {
                Ok(response) => {
                    let status = response.status();
                    let text = response.text().await.unwrap_or_default();
                    if status.is_success() {
                        return Ok(serde_json::from_str::<Value>(&text).unwrap_or(json!({
                            "status": "ok",
                            "raw": text
                        })));
                    }
                    errors.push(format!("POST {} failed with {}: {}", endpoint, status, text));
                }
                Err(err) => {
                    errors.push(format!("POST {} failed: {}", endpoint, err));
                }
            }
        }

        let interaction_target = format!("/interaction/{}", id);
        let action_base = self.base_url
            .strip_suffix("/interaction")
            .unwrap_or(self.base_url.as_str())
            .trim_end_matches('/');
        let action_endpoint = format!("{}/action", action_base);
        let action_candidates = vec![
            json!({
                "id": id,
                "type": "Execute",
                "namespace": "core.Interaction",
                "target": interaction_target
            }),
            json!({
                "id": id,
                "type": "Execute",
                "namespace": "core.RWE",
                "target": interaction_target
            }),
            json!({
                "id": id,
                "type": "Trigger",
                "namespace": "core.Interaction",
                "target": interaction_target
            }),
            json!({
                "id": id,
                "type": "SetTrigger",
                "namespace": "core.Interaction",
                "target": interaction_target
            }),
        ];

        for payload in action_candidates {
            match api_client.post(action_endpoint.clone()).json(&payload).send().await {
                Ok(response) => {
                    let status = response.status();
                    let text = response.text().await.unwrap_or_default();
                    if status.is_success() {
                        return Ok(serde_json::from_str::<Value>(&text).unwrap_or(json!({
                            "status": "ok",
                            "raw": text
                        })));
                    }

                    errors.push(format!("POST {} with payload {} failed with {}: {}", action_endpoint, payload, status, text));
                }
                Err(err) => {
                    errors.push(format!("POST {} with payload {} failed: {}", action_endpoint, payload, err));
                }
            }
        }

        Err(errors.join(" | "))
    }
}
