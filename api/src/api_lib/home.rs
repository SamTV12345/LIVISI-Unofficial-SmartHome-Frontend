

use serde::Serialize;
use serde::Deserialize;
use serde_json::Value;
use crate::CLIENT_DATA;

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Home{
    pub base_url: String,
}


#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct HomeSetupResponse{
    pub config: HomeSetupConfig,
    pub id: Option<String>,
    pub tags: Option<Value>
}


#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct HomeSetupConfig{
    pub country: String,
    pub geo_location: String,
    pub household_type: String,
    pub living_area: i32,
    pub name: String,
    pub number_of_floors: i32,
    pub number_of_persons: i32,
    pub post_code: String
}

impl Home{
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/home")
        }
    }

    pub async fn get_home_setup(&self) -> Result<HomeSetupResponse, String> {
        let api_client = {
            let client_lock = CLIENT_DATA
                .get()
                .ok_or_else(|| "CLIENT_DATA is not initialized".to_string())?
                .lock()
                .map_err(|error| format!("Could not lock CLIENT_DATA: {}", error))?;
            client_lock.client.clone()
        };

        let response = api_client
            .get(self.base_url.clone() + "/setup")
            .send()
            .await
            .map_err(|error| format!("Could not fetch /home/setup: {}", error))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("/home/setup returned status {}", status));
        }

        response
            .json::<HomeSetupResponse>()
            .await
            .map_err(|error| format!("Could not decode /home/setup response: {}", error))
    }
}
