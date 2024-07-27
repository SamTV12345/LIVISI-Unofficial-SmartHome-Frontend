use std::collections::HashMap;
use serde_derive::Serialize;
use serde_derive::Deserialize;

use crate::CLIENT_DATA;

#[derive(Clone)]
pub struct Location{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocationResponse{
    pub config: LocationConfig,
    pub id:String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub devices: Option<Vec<String>>
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocationConfig{
    name: String,
    r#type: String
}

impl Location {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/location")
        }
    }

    pub async fn update_location(&self, location_data: LocationResponse, location_id: String) -> LocationResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.put(self.base_url.clone()+"/"+&location_id)
            .json(&location_data)
            .send()
            .await
            .unwrap();

            response
                .json::<LocationResponse>()
            .await
            .unwrap()
    }

    pub async fn delete_location(&self, location_id: String) -> LocationResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.delete(self.base_url.clone()+"/"+&location_id)
            .send()
            .await
            .unwrap();

            response
                .json::<LocationResponse>()
            .await
            .unwrap()
    }

    pub async fn create_location(&self, location_data: LocationResponse) -> LocationResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.post(self.base_url.clone())
            .json(&location_data)
            .send()
            .await
            .unwrap();

            response
                .json::<LocationResponse>()
            .await
            .unwrap()
    }

    pub async fn get_locations(&self) -> Vec<LocationResponse> {
        let locked_client = CLIENT_DATA.get().unwrap().lock();

        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await
            .unwrap();

            response
                .json::<Vec<LocationResponse>>()
            .await
            .unwrap()
    }

    pub async fn get_location_by_id(&self, location_id: String) -> LocationResponse {
        let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone()+"/"+&location_id)
            .send()
            .await
            .unwrap();

            response
                .json::<LocationResponse>()
            .await
            .unwrap()
    }
}