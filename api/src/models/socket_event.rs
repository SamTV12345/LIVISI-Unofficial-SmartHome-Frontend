use std::collections::HashMap;
use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use crate::api_lib::interaction::{FieldValue, InteractionResponse};


#[derive(Serialize,Deserialize, Debug)]
pub struct SocketEvent {
    pub id: Option<String>,
    pub r#type: String,
    pub  namespace: String,
    pub  desc: String,
    pub class: Option<String>,
    pub source: String,
    pub  timestamp: String,
    pub  properties: Option<Properties>,
    pub  context: Option<HashMap<String, FieldValue>>,
    pub data: Option<SocketData>,
    pub device: Option<String>,
    pub read: Option<bool>
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(untagged)]
pub enum SocketData {
    ConfigVersion(ConfigVersion),
    DeviceUnreachable(Box<DeviceUnreachable>),
    Value(Value)
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceUnreachable {
    id: String,
    class:String,
    r#type: String,
    namespace: String,
    desc: String,
    source: String,
    timestamp: String,
    devices: Vec<String>,
    capabilities: Vec<String>,
    read: bool,
    state: bool,
    properties: HashMap<String, Value>,
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ConfigVersion {
    pub config_version: i32,
    pub interactions: Vec<InteractionResponse>
}


pub enum Source {
    Device,
    Capability,
    Location,
    User,
    System,
    Message
}

impl SocketEvent {
    pub fn get_source(&self) -> Source {
        return if self.source.starts_with("/device") {
            Source::Device
        } else if self.source.starts_with("/capability") {
            Source::Capability
        } else if self.source.starts_with("/location") {
            Source::Location
        } else if self.source.starts_with("/user") {
            Source::User
        } else if let Some(m) = self.class.clone(){
            if m == "message" {
               return Source::Message
            }
            Source::System
        } else {
            Source::System
        };
    }

    pub fn get_id(&self) -> Option<String> {
        return self.source.split("/").last().map(|s| s.to_string());
    }
}


#[derive(Serialize,Deserialize, Debug)]
#[serde(untagged)]
pub enum Properties {
    PointTemperature(PointTemperature),
    Temperature(Temperature),
    Threshold(Threshold),
    OnState(OnState),
    IsOpen(IsOpenState),
    ConfigVersion(PropertyConfigVersion),
    ZustandChange(ZustandChange),
    DeviceConfigurationState(DeviceConfigurationState),
    HeatingSetPoint(HeatingSetPoint),
    CPUUsage(CPUUSage),
    HumidityChange(HumidityChange),
    Reachable(Reachable),
    ChangeReason(ChangeReason),
    Value(Value)
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeReason {
    pub change_reason: String,
    pub expires_after_minutes: i32,
    pub module: String,
    pub requester_info: String
}

#[derive(Serialize,Deserialize, Debug)]
pub struct Reachable {
    pub is_reachable: bool
}


#[derive(Serialize,Deserialize, Debug)]
pub struct HumidityChange {
    pub humidity: f64
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CPUUSage {
    pub cpu_usage: f64
}


#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HeatingSetPoint {
    pub setpoint_temperature: f64
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfigurationState {
    pub device_configuration_state: String
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ZustandChange {
    pub value: bool
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PropertyConfigVersion {
    pub config_version: i32
}

#[derive(Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PointTemperature {
    pub point_temperature: f64
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Temperature {
    pub temperature: f64
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Threshold {
    pub threshold: f64,
    pub status: String
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OnState {
    pub on_state: bool
}

#[derive(Default,Serialize,Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IsOpenState {
    pub is_open: bool
}