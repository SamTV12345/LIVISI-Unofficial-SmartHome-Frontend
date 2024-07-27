use std::collections::HashMap;
use std::sync::Mutex;
use actix_web::cookie::Expiration::DateTime;
use chrono::Utc;
use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use crate::api_lib::{capability, interaction};
use crate::api_lib::capability::{CapabilityConfig, CapabilityResponse, CapabilityStateResponse};
use crate::api_lib::capability::CapValueType::CapValueItem;
use crate::api_lib::device::{DeviceConfig, DeviceResponse};
use crate::api_lib::email::EmailAPI;
use crate::api_lib::location::LocationResponse;
use crate::api_lib::message::MessageResponse;
use crate::api_lib::status::StatusResponse;
use crate::api_lib::user_storage::UserStorageResponse;
use crate::models::socket_event::{Properties, SocketEvent, Source};
use crate::models::token::Token;

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
    pub email: Option<EmailAPI>
}


impl Data {
    pub fn handle_socket_event(&mut self, socket_event: &mut SocketEvent) {
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
                                let mut state = device.capability_state.as_mut();
                                socket_event.device = Some(id.clone());
                                if let Some(cap_state) = state {
                                    cap_state.0.iter_mut().for_each(|mut cap_s| {
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
                log::info!("system change")
            }
        }
    }

    pub fn set_email(&mut self, email: EmailAPI) {
        self.email = Some(email);
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
        self.devices.iter_mut().for_each(|(id, device)| {
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
            })
        }
    }
}

