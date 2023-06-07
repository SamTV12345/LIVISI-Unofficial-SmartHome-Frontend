use reqwest::Client;
use crate::utils::header_utils::HeaderUtils;
use serde::Serialize;
use serde::Deserialize;

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Home{
    pub base_url: String,
}


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HomeSetupResponse{
    pub config: HomeSetupConfig,
    id: String,
    tags: Vec<String>
}


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
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
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url + "/home"
        }
    }

    pub async fn get_home_setup(&self, client: Client, token: String) ->HomeSetupResponse {
        let response = client.get(self.base_url.clone()+"/setup")
            .headers(HeaderUtils::get_auth_token_header(token))
            .send()
            .await
            .unwrap();

            response.json::<HomeSetupResponse>()
            .await
            .unwrap()
    }
}
