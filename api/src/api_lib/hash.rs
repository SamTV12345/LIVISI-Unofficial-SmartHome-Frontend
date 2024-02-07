

use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;

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

    pub async fn get_hash(&self) -> HashResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response.json::<HashResponse>()
            .await
            .unwrap()
    }
}