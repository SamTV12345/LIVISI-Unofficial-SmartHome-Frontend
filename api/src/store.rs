use std::sync::Mutex;
use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use crate::api_lib::capability::{Capability, CapabilityConfig, CapabilityResponse};
use crate::api_lib::device::{DeviceConfig, DevicePost, DeviceResponse};
use crate::api_lib::location::LocationResponse;
use crate::api_lib::status::StatusResponse;
use crate::api_lib::user_storage::UserStorageResponse;
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
    pub location_data: Option<LocationResponse>
}

#[derive(Default,Serialize,Deserialize, Debug,Clone)]
pub struct  CapabilitiesStore {
    pub id: String,
    pub r#type: String,
    pub device: String,
    pub config: CapabilityConfig
}

pub struct Data {
    pub devices: Vec<DeviceStore>,
    pub status: Option<StatusResponse>,
    pub user_storage: Option<UserStorageResponse>,
    pub locations: Vec<LocationResponse>,
    pub(crate) capabilities: Vec<CapabilitiesStore>
}


impl Data {

    pub fn set_devices(&mut self, devices: DeviceResponse) {
        let devices = devices.0.into_iter().map(|device|
            DeviceStore {
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
            }
        ).collect::<Vec<_>>();
        self.devices = devices;
    }

    pub fn set_status(&mut self, status: StatusResponse) {
        self.status = Some(status);
    }

    pub fn set_locations(&mut self, locations: Vec<LocationResponse>) {
        self.locations = locations.clone();
        self.devices.iter_mut().for_each(|device| {
            if device.location.is_some(){
                let opt_location = locations.iter().find(|location| location.id == device.location.clone().unwrap());
                if opt_location.is_some(){
                    let wrapped = opt_location.unwrap();
                    device.location_data = Some(LocationResponse{
                        id: wrapped.id.clone(),
                        config: wrapped.config.clone(),
                        devices: None
                    });
                }
            }
        });
    }

    pub fn set_capabilities(&mut self, capabilities: CapabilityResponse) {
        self.capabilities = capabilities.0.iter().map(|capability| CapabilitiesStore {
            id: capability.id.clone(),
            r#type: capability.r#type.clone(),
            device: capability.device.clone(),
            config: capability.config.clone()
        })
            .collect::<Vec<_>>();
    }

    pub fn set_user_storage(&mut self, user_storage: UserStorageResponse) {
        self.user_storage = Some(user_storage);
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
                devices: Vec::new(),
                user_storage: None,
                locations: Vec::new(),
                capabilities: Vec::new()
            })
        }
    }
}

