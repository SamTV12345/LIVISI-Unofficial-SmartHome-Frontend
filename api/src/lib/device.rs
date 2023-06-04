use reqwest::Client;
use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::utils::header_utils::HeaderUtils;

#[derive(Clone)]
pub struct Device{
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceResponse(Vec<DevicePost>);

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateResponse(Vec<DeviceState>);


#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DevicePost{
    pub config: DeviceConfig,
    pub capabilities: Vec<String>,
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location:Option<String>,
    pub manufacturer: String,
    pub product: String,
    pub serial_number: String,
    pub r#type: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<DeviceTags>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceState{
    pub id: String,
    pub state: DeviceInnerState,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInnerState{
    #[serde(skip_serializing_if = "Option::is_none")]
    is_reachable: Option<DeviceStateBooleanIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    device_configuration_state: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    device_inclusion_state: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    update_state: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    firmware_version: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    update_available: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_reboot: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    _m_bus_dongle_attached: Option<DeviceStateBooleanIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    _lb_dongle_attached: Option<DeviceStateBooleanIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    config_version: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    discovery_active: Option<DeviceStateBooleanIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ipaddress: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    current_utc_offset: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    products_hash: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    _o_s_state: Option<DeviceStateIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    memory_load: Option<DeviceStateNumberIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    _c_p_u_load: Option<DeviceStateNumberIndicator>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disk_usage: Option<DeviceStateNumberIndicator>,
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateBooleanIndicator{
    pub value: bool,
    pub last_changed: String
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateNumberIndicator{
    pub value: i32,
    pub last_changed: String
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateIndicator{
    pub value: String,
    pub last_changed: String
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceTags{
    pub internal_state_id: Option<String>
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfig{
    pub activity_log_active: Option<bool>,
    pub friendly_name: Option<String>,
    pub model_id: Option<String>,
    pub name: String,
    pub protocol_id: String,
    pub time_of_acceptance: String,
    pub time_of_discovery: Option<String>,
    pub underlying_device_ids: Option<String>
}


impl Device {
    pub fn new(server_url: String) -> Self {
        Self {
            base_url: server_url+"/device"
        }
    }
   pub async fn get_devices(&self, client: Client, access_token: String)  ->DeviceResponse{
        let response = client.get(self.base_url.clone())
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .send()
            .await
            .unwrap();
        return  response.json::<DeviceResponse>()
            .await
            .unwrap()
    }


    pub async fn get_all_device_states(&self, client: Client, access_token: String)  ->DeviceState{
        let response = client.get(self.base_url.clone()+"/states")
            .headers(HeaderUtils::get_auth_token_header(access_token))
            .send()
            .await
            .unwrap();
        return  response.json::<DeviceState>()
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