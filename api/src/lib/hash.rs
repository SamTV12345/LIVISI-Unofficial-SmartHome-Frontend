use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde_derive::Serialize;
use serde_derive::Deserialize;

#[derive(Clone)]
pub struct Hash{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HashResponse{
    pub hash: String
}

impl Hash{
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/product/hash"
        }
    }

    pub async fn get_hash(&self, client: Client, token: String) -> HashResponse {
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<HashResponse>()
            .await
            .unwrap()
    }
}