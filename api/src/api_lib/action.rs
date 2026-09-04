use std::collections::HashMap;

use crate::CLIENT_DATA;
use crate::api_lib::interaction::ValueItem;
use crate::api_lib::livisi_response_type::LivisResponseType;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;

#[derive(Clone)]
pub struct Action {
    pub base_url: String,
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct ActionPost {
    pub r#type: String,
    pub id: String,
    pub namespace: String,
    pub target: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<HashMap<String, ValueItem>>,
}

#[derive(Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActionPostResponse {
    #[serde(default)]
    pub r#type: String,
    #[serde(default)]
    pub namespace: String,
    #[serde(default)]
    pub desc: String,
    #[serde(default)]
    pub target: String,
    #[serde(default)]
    pub properties: Value,
    #[serde(default)]
    pub result_code: String,
}

impl Action {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/action"),
        }
    }
    pub async fn post_action(
        &self,
        action: ActionPost,
    ) -> Result<LivisResponseType<ActionPostResponse>, reqwest::Error> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client
            .post(self.base_url.clone())
            .json(&action)
            .send()
            .await?;
        match response
            .json::<LivisResponseType<ActionPostResponse>>()
            .await
        {
            Ok(parsed) => Ok(parsed),
            Err(err) => {
                log::warn!(
                    "Could not parse action response (treating as accepted): {}",
                    err
                );
                Ok(LivisResponseType::Ok(ActionPostResponse::default()))
            }
        }
    }
}
