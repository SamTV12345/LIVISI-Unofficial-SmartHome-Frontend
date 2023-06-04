use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde_derive::Serialize;
use serde_derive::Deserialize;

#[derive(Clone)]
pub struct Relationship{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RelationshipResponse{
    pub serial_number: String,
    pub account_name: String,
    pub config: RelationshipConfig,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RelationshipConfig{
    pub permission: String,
    pub name: String,
}

impl Relationship{
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/relationship"
        }
    }

    pub async fn get_relationship(&self, client: Client, token: String) ->
                                                                        Vec<RelationshipResponse> {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<Vec<RelationshipResponse>>()
            .await
            .unwrap()
    }
}