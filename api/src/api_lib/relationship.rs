

use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;

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

    pub async fn get_relationship(&self) ->
                                                                        Vec<RelationshipResponse> {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<Vec<RelationshipResponse>>()
            .await
            .unwrap()
    }
}