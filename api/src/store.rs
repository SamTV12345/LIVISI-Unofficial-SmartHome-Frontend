use std::collections::HashMap;
use std::sync::Mutex;
use chrono::Utc;
use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use crate::api_lib::{capability, interaction};
use crate::api_lib::capability::{CapabilityConfig, CapabilityResponse, CapabilityStateResponse};
use crate::api_lib::capability::CapValueType::CapValueItem;
use crate::api_lib::device::{DeviceConfig, DeviceResponse};
use crate::api_lib::email::EmailAPI;
use crate::api_lib::interaction::InteractionResponse;
use crate::api_lib::location::LocationResponse;
use crate::api_lib::message::MessageResponse;
use crate::api_lib::status::StatusResponse;
use crate::api_lib::user_storage::UserStorageResponse;
use crate::models::socket_event::{Properties, SocketData, SocketEvent, Source};
use crate::models::token::Token;
use crate::sentry::{SentryAlert, SentrySettings};

#[derive(Default,Serialize,Deserialize, Debug,Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStore {
    pub manufacturer: String,
    pub r#type: String,
    pub version: String,
    pub product: String,
    pub serial_number: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location:Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<DeviceConfig>,
    pub volatile: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location_data: Option<LocationResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capability_data: Option<Vec<CapabilitiesStore>>,
    pub capability_state: Option<CapabilityStateResponse>
}

#[derive(Default,Serialize,Deserialize, Debug,Clone)]
pub struct  CapabilitiesStore {
    pub id: String,
    pub r#type: String,
    pub device: String,
    pub config: CapabilityConfig
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
pub struct Data {
    pub devices: HashMap<String, DeviceStore>,
    pub status: Option<StatusResponse>,
    pub user_storage: Option<UserStorageResponse>,
    pub locations: Vec<LocationResponse>,
    pub(crate) capabilities: Vec<CapabilitiesStore>,
    pub messages: Vec<MessageResponse>,
    pub email: Option<EmailAPI>,
    pub sentry_settings: Option<SentrySettings>,
    #[serde(default)]
    pub interactions: Vec<InteractionResponse>
}


impl Data {
    pub fn handle_socket_event(&mut self, socket_event: &mut SocketEvent) -> Option<SentryAlert> {
        let mut sentry_alert = None;
        match socket_event.get_source() {
            Source::Device => {
                log::info!("device change")
            }
            Source::Capability => {
                log::info!("capability change");
                self.devices.iter_mut().for_each(|(id, device)| {
                    if let Some(capabilities) = &device.capabilities {
                        let found_id = &socket_event.get_id();
                        if let Some(found_id) = found_id.clone() {
                            if capabilities.contains(&socket_event.source) {
                                let sentry_device_type = device.r#type.clone();
                                let sentry_device_id = device.id.clone();
                                let sentry_device_name =
                                    device.config.as_ref().and_then(|config| config.name.clone());
                                let sentry_location_name = device
                                    .location_data
                                    .as_ref()
                                    .map(|location| location.config.name.clone());
                                let state = device.capability_state.as_mut();
                                socket_event.device = Some(id.clone());
                                if let Some(cap_state) = state {
                                    cap_state.0.iter_mut().for_each(|cap_s| {
                                        if cap_s.id == found_id {
                                            match &socket_event.properties {
                                                None => {}
                                                Some(props) => {
                                                    match props {
                                                        Properties::HumidityChange(h)=>{
                                                            let map = cap_s.state.as_mut();
                                                            if let Some(m) = map {
                                                                let current_value = Utc::now()
                                                                    .to_rfc3339();
                                                                let cap_value = CapValueItem
                                                                    (capability::CapValueItem{
                                                                        value: Some
                                                                            (interaction::FieldValue::FloatValue(h.humidity as f32)),
                                                                        last_changed: current_value
                                                                    });

                                                                m.insert("humidity".to_string(),
                                                                         cap_value);
                                                            }
                                                        }
                                                        Properties::PointTemperature(_) => {}
                                                        Properties::Temperature(temp) => {
                                                            let map = cap_s.state.as_mut();
                                                            if let Some(m) = map {
                                                                let current_value = Utc::now()
                                                                    .to_rfc3339();
                                                                let cap_value = CapValueItem
                                                                    (capability::CapValueItem{
                                                                        value: Some
                                                                            (interaction::FieldValue::FloatValue(temp.temperature as f32)),
                                                                        last_changed: current_value
                                                                    });

                                                                m.insert("temperature".to_string(),
                                                                         cap_value);
                                                            }
                                                        }
                                                        Properties::Threshold(_) => {}
                                                        Properties::OnState(e) => {
                                                            let map = cap_s.state.as_mut();
                                                            if let Some(m) = map {
                                                                let current_value = Utc::now()
                                                                    .to_rfc3339();
                                                                let cap_value = CapValueItem
                                                                    (capability::CapValueItem{
                                                                        value: Some
                                                                            (interaction::FieldValue::BooleanValue(e.on_state)),
                                                                        last_changed: current_value
                                                                    });

                                                                m.insert("onState".to_string(),
                                                                         cap_value);
                                                            }
                                                        }
                                                        Properties::ConfigVersion(_) => {}
                                                        Properties::ZustandChange(_) => {}
                                                        Properties::DeviceConfigurationState(_) => {}
                                                        Properties::HeatingSetPoint(v) => {
                                                            let map = cap_s.state.as_mut();
                                                            if let Some(m) = map {
                                                                let current_value = Utc::now()
                                                                    .to_rfc3339();
                                                                let cap_value = CapValueItem
                                                                    (capability::CapValueItem{
                                                                        value: Some
                                                                            (interaction::FieldValue::FloatValue(v.setpoint_temperature as f32)),
                                                                        last_changed: current_value
                                                                    });

                                                                m.insert("setpointTemperature".to_string(), cap_value);
                                                            }
                                                        }
                                                        Properties::CPUUsage(_) => {}
                                                        Properties::Value(_) => {}
                                                        Properties::IsOpen(is_open)=>{
                                                            let map = cap_s.state.as_mut();
                                                            if let Some(m) = map {
                                                                let previous_is_open = m.get("isOpen")
                                                                    .and_then(extract_boolean_capability_value);
                                                                let current_value = Utc::now()
                                                                    .to_rfc3339();
                                                                let cap_value = CapValueItem
                                                                    (capability::CapValueItem{
                                                                        value: Some
                                                                            (interaction::FieldValue::BooleanValue(is_open.is_open)),
                                                                        last_changed: current_value
                                                                    });

                                                                m.insert("isOpen".to_string(), cap_value);
                                                                if previous_is_open != Some(is_open.is_open) {
                                                                    sentry_alert = build_sentry_alert(
                                                                        &sentry_device_type,
                                                                        sentry_device_id.clone(),
                                                                        sentry_device_name.clone(),
                                                                        sentry_location_name.clone(),
                                                                        is_open.is_open,
                                                                        &socket_event.timestamp,
                                                                    );
                                                                }
                                                            }
                                                        }
                                                        Properties::Reachable(_) => {

                                                        }
                                                        _ => {}
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        }
                    }
                })
            }
            Source::Location => {
                log::info!("location change")

            }
            Source::User => {
                log::info!("user change")

            }
            Source::System => {
                log::info!("system change");

                if let Some(Properties::ConfigVersion(config_version)) = &socket_event.properties {
                    if let Some(status) = self.status.as_mut() {
                        status.config_version = config_version.config_version;
                    }
                }

                if let Some(SocketData::ConfigVersion(config_version_data)) = &socket_event.data {
                    if let Some(status) = self.status.as_mut() {
                        status.config_version = config_version_data.config_version;
                    }
                    self.set_interactions(config_version_data.interactions.clone());
                }
            }
            Source::Message =>{
                if let Some(id) = socket_event.id.clone() {
                    let mut found_item = false;
                    self.messages.iter_mut().for_each(|m|{
                        if m.id == id {
                            found_item = true;
                            m.class = socket_event.class.clone();
                            m.read = socket_event.read.unwrap_or(m.read);
                        }
                    });

                    if !found_item {

                        //TODO hier weiter:

                        /*
                        {"id":"21c509371e95491c9684c1d8e64fb421","class":"message","type":"LogLevelChanged","namespace":"core.RWE","desc":"/desc/device/SHCA.RWE/1.0/message/LogLevelChanged","source":"/device/00000000000000000000000000000000","timestamp":"2024-07-28T19:48:04.781511Z","devices":[],"capabilities":[],"read":true,"properties":{"changeReason":"Test","expiresAfterMinutes":120,"module":"","requesterInfo":"Administrator"}}
                         */

                        let props = match serde_json::to_string(&socket_event.properties) {
                            Ok(serialized) => serde_json::from_str(&serialized).ok(),
                            Err(_) => None,
                        };

                        self.messages.push(MessageResponse{
                            id,
                            timestamp: socket_event.timestamp.clone(),
                            read: socket_event.read.unwrap_or(false),
                            devices: None,
                            messages: None,
                            capabilities: None,
                            properties: props,
                            class: socket_event.class.clone(),
                            r#type: socket_event.r#type.clone(),
                            namespace: Option::from(socket_event.namespace.clone()),
                            tags: None,
                        })
                    }

                }


            }
        }
        sentry_alert
    }

    pub fn set_email(&mut self, email: EmailAPI) {
        self.email = Some(email);
    }

    pub fn set_sentry_settings(&mut self, sentry_settings: SentrySettings) {
        self.sentry_settings = Some(sentry_settings);
    }

    pub fn set_devices(&mut self, devices: DeviceResponse) {
        devices.0.into_iter().for_each(|device|{
            let device_store = DeviceStore {
                manufacturer: device.manufacturer.clone(),
                r#type: device.r#type.clone(),
                version: device.version.clone(),
                product: device.product.clone(),
                serial_number: device.serial_number.clone(),
                id: device.id.clone(),
                location: device.location.clone(),
                config: device.config.clone(),
                volatile: device.volatile.clone(),
                capabilities: device.capabilities.clone(),
                tags: device.tags.clone(),
                location_data: None,
                capability_data: None,
                capability_state: None
            };
            self.devices.insert(device.id.clone().unwrap(), device_store);
        });
    }

    pub fn set_status(&mut self, status: StatusResponse) {
        self.status = Some(status);
    }

    pub fn set_locations(&mut self, locations: Vec<LocationResponse>) {
        self.locations.clone_from(&locations);
        self.devices.iter_mut().for_each(|(id,device)| {

            match &device.location {
                Some(location) => {
                    let opt_location = locations.iter().find(|location_iter| location_iter.id ==
                        location.replace("/location/","").clone());
                    if opt_location.is_some(){
                        let wrapped = opt_location.unwrap();
                        device.location_data = Some(LocationResponse{
                            id: wrapped.id.clone(),
                            config: wrapped.config.clone(),
                            devices: None,
                            tags: wrapped.tags.clone()
                        });
                        self.locations.iter_mut().for_each(|location| {
                            if location.id == wrapped.id {
                                if location.devices.is_none() {
                                    location.devices = Some(vec![id.clone()]);
                                }
                                else {
                                    location.devices.as_mut().unwrap().push(id.clone());
                                }
                            }
                        });
                    }
                },
                None => {}
            }
        });
    }

    pub fn set_capabilities(&mut self, capabilities: CapabilityResponse) {
        self.capabilities = capabilities.0
            .iter()
            .map(|capability| CapabilitiesStore {
            id: capability.id.clone(),
            r#type: capability.r#type.clone(),
            device: capability.device.clone(),
            config: capability.config.clone()
        })
            .collect::<Vec<_>>();

        self.capabilities.iter().for_each(|cap|{
           self.devices.contains_key(&cap.device).then(||{
               let found_device = self.devices.get_mut(&cap.device.replace("/device/","")).unwrap();
               if found_device.capability_data.is_none() {
                   found_device.capability_data = Some(vec![cap.clone()]);
               }
               else {
                   found_device.capability_data.as_mut().unwrap().push(cap.clone());
               }
               self.devices.get_mut(&cap.device).unwrap().capabilities = Some(vec![cap.id.clone()]);
           });
        });
    }


    pub fn set_capabilities_state(&mut self, capabilities_arg: CapabilityStateResponse) {
        self.devices.iter_mut().for_each(|(_, device)| {
            if let Some(capabilities) = &device.capabilities {
                let mut cap = Vec::new();
                capabilities.iter()
                    .for_each(|capability| {
                    let capability_store = capabilities_arg.0
                        .iter()
                        .find(|capability_store| capability_store.id == *capability.replace("/capability/",""));
                        if let Some(capability_store) = capability_store {
                            cap.push(capability_store.clone());
                        }
                });
                device.capability_state = Some(CapabilityStateResponse(cap));
            }
        })
    }

    pub fn set_user_storage(&mut self, user_storage: UserStorageResponse) {
        self.user_storage = Some(user_storage);
    }

    pub fn set_messages(&mut self, messages: Vec<MessageResponse>) {
        self.messages.clone_from(&messages);
    }

    pub fn set_interactions(&mut self, interactions: Vec<InteractionResponse>) {
        self.interactions.clone_from(&interactions);
    }
}

pub struct Store {
    pub token: Mutex<Token>,
    pub data: Mutex<Data>
}

impl Store {
    pub fn new(token: Token) -> Self {
        Self {
            token: Mutex::new(token),
            data: Mutex::new(Data{
                status: None,
                devices: HashMap::new(),
                user_storage: None,
                locations: Vec::new(),
                capabilities: Vec::new(),
                messages: Vec::new(),
                email: None,
                sentry_settings: None,
                interactions: Vec::new(),
            })
        }
    }
}

fn extract_boolean_capability_value(capability_value: &crate::api_lib::capability::CapValueType) -> Option<bool> {
    match capability_value {
        crate::api_lib::capability::CapValueType::CapabilityInnerVal(value) => match &value.value.value {
            Some(interaction::FieldValue::BooleanValue(value)) => Some(*value),
            _ => None,
        },
        crate::api_lib::capability::CapValueType::CapValueItem(value) => match &value.value {
            Some(interaction::FieldValue::BooleanValue(value)) => Some(*value),
            _ => None,
        },
    }
}

fn build_sentry_alert(
    device_type: &str,
    device_id: Option<String>,
    device_name: Option<String>,
    location_name: Option<String>,
    is_open: bool,
    occurred_at: &str,
) -> Option<SentryAlert> {
    if device_type != "WDS" {
        return None;
    }

    Some(SentryAlert {
        device_id: device_id?,
        device_name: device_name?,
        location_name,
        is_open,
        occurred_at: occurred_at.to_string(),
    })
}

