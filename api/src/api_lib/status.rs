
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::CLIENT_DATA;



#[derive(Clone)]
pub struct Status{
    base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse{
    pub app_version: String,
    pub config_version: i32,
    pub connected: bool,
    pub controller_type: String,
    pub network: StatusNetwork,
    pub os_version: String,
    pub serial_number: String,
    pub operation_status: String
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatusNetwork {
    pub backend_available: bool,
    pub bluetooth_hotspot_name: String,
    pub eth_cable_attached: bool,
    pub eth_ip_address: String,
    pub eth_mac_address: String,
    pub hostname: String,
    pub hotspot_active: bool,
    pub in_use_adapter: String,
    pub wifi_active_ssid: String,
    pub wifi_ip_address: String,
    pub wifi_mac_address: String,
    pub wifi_signal_strength: i32,
    pub wps_active: bool,
}

impl Status {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/status")
        }
    }
   pub async fn get_status(&self) -> StatusResponse {
       let locked_client = CLIENT_DATA.get().unwrap().lock();
        let response = locked_client.unwrap().client.get(self.base_url.clone())
            .send()
            .await.unwrap();

            response.json::<StatusResponse>()
            .await
            .unwrap()
    }
}