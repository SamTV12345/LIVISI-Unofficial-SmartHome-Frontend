use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;

pub struct Device{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceResponse{
    pub devices: Vec<DevicePost>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DevicePost{
    pub id: String,
    pub manufacturer: String,
    pub version: String,
    pub product: String,
    pub serial_number: String,
    pub r#type: String,
    pub config: DeviceConfig,
    pub tags: DeviceTags
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceTags{
    pub r#type: String,
    pub type_category: String,
    pub capabilities: Vec<String>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfig{
    pub activity_log_active: bool,
    pub friendly_name: String,
    pub model_id: String,
    pub name: String,
    pub protocol_id: String,
    pub time_of_acceptance: String,
    pub time_of_discovery: String
}


impl Device {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/device"
        }
    }
   pub async fn get_status(&self, client: Client) -> DeviceResponse {
        client.get(self.base_url.clone())
            .send()
            .await
            .unwrap()
            .json::<DeviceResponse>()
            .await
            .unwrap()
    }


    pub async fn post_status(&self, client: Client, device_post:DevicePost) -> String {
        let response = client.post(self.base_url.clone())
            .json::<DevicePost>(&device_post)
            .send()
            .await;
        match response {
            Ok(response) => {
                match response.status().as_u16() {
                    200 => {
                        let response = response.text().await.unwrap();
                        response
                    },
                    _ => {
                        let response = response.text().await.unwrap();
                        response
                    }
                }
            },
            Err(e) => {
                let response = e.to_string();
                response
            }
        }
    }
}