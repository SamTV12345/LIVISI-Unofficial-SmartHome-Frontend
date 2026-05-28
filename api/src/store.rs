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
                                                        Properties::HumidityChange(h) => {
                                                            upsert_capability_value(
                                                                &mut cap_s.state,
                                                                "humidity",
                                                                interaction::FieldValue::FloatValue(h.humidity as f32),
                                                            );
                                                        }
                                                        Properties::Temperature(temp) => {
                                                            upsert_capability_value(
                                                                &mut cap_s.state,
                                                                "temperature",
                                                                interaction::FieldValue::FloatValue(temp.temperature as f32),
                                                            );
                                                        }
                                                        Properties::OnState(e) => {
                                                            upsert_capability_value(
                                                                &mut cap_s.state,
                                                                "onState",
                                                                interaction::FieldValue::BooleanValue(e.on_state),
                                                            );
                                                        }
                                                        Properties::HeatingSetPoint(v) => {
                                                            upsert_capability_value(
                                                                &mut cap_s.state,
                                                                "setpointTemperature",
                                                                interaction::FieldValue::FloatValue(v.setpoint_temperature as f32),
                                                            );
                                                        }
                                                        Properties::IsOpen(is_open) => {
                                                            // Only react when the capability already has a
                                                            // state map (matching the previous behaviour);
                                                            // a sentry alert is raised on an actual change.
                                                            if cap_s.state.is_some() {
                                                                let previous_is_open = cap_s
                                                                    .state
                                                                    .as_ref()
                                                                    .and_then(|map| map.get("isOpen"))
                                                                    .and_then(extract_boolean_capability_value);
                                                                upsert_capability_value(
                                                                    &mut cap_s.state,
                                                                    "isOpen",
                                                                    interaction::FieldValue::BooleanValue(is_open.is_open),
                                                                );
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
                config: capability.config.clone(),
            })
            .collect::<Vec<_>>();
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

/// Inserts/overwrites a single capability value (stamped with the current time)
/// into a capability's state map, if that map exists. Centralises the repeated
/// "build a CapValueItem and insert it" logic from `handle_socket_event`.
fn upsert_capability_value(
    state: &mut Option<HashMap<String, crate::api_lib::capability::CapValueType>>,
    key: &str,
    value: interaction::FieldValue,
) {
    if let Some(map) = state.as_mut() {
        map.insert(
            key.to_string(),
            CapValueItem(capability::CapValueItem {
                value: Some(value),
                last_changed: Utc::now().to_rfc3339(),
            }),
        );
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api_lib::capability::{CapValueType, CapabilityStateResponse};
    use crate::api_lib::device::DeviceResponse;
    use crate::api_lib::location::LocationResponse;
    use crate::models::socket_event::SocketEvent;
    use serde_json::json;

    /// A single WDS contact sensor (`device-1`) carrying one capability
    /// (`cap-1`) whose cached state starts as `isOpen: false`.
    fn wds_device_data() -> Data {
        let mut data = Data::default();
        let devices: DeviceResponse = serde_json::from_value(json!([
            {
                "manufacturer": "RWE",
                "type": "WDS",
                "version": "1.0",
                "product": "SHC.RWE",
                "serialNumber": "serial-1",
                "id": "device-1",
                "location": "/location/loc-1",
                "capabilities": ["/capability/cap-1"],
                "config": { "name": "Front Door" }
            }
        ]))
        .unwrap();
        data.set_devices(devices);

        let states: CapabilityStateResponse = serde_json::from_value(json!([
            {
                "id": "cap-1",
                "state": {
                    "isOpen": { "value": false, "lastChanged": "2024-01-01T00:00:00Z" }
                }
            }
        ]))
        .unwrap();
        data.set_capabilities_state(states);
        data
    }

    fn capability_event(properties: serde_json::Value) -> SocketEvent {
        serde_json::from_value(json!({
            "type": "StateChanged",
            "namespace": "core.RWE",
            "desc": "/desc",
            "source": "/capability/cap-1",
            "timestamp": "2024-01-02T00:00:00Z",
            "properties": properties
        }))
        .unwrap()
    }

    fn cached_value<'a>(data: &'a Data, device_id: &str, key: &str) -> Option<&'a CapValueType> {
        let device = data.devices.get(device_id)?;
        let inner = device
            .capability_state
            .as_ref()?
            .0
            .iter()
            .find(|c| c.id == "cap-1")?;
        inner.state.as_ref()?.get(key)
    }

    #[test]
    fn set_devices_indexes_by_id() {
        let data = wds_device_data();
        assert_eq!(data.devices.len(), 1);
        assert!(data.devices.contains_key("device-1"));
    }

    #[test]
    fn capability_state_is_attached_to_its_device() {
        let data = wds_device_data();
        let value = cached_value(&data, "device-1", "isOpen").expect("isOpen should be cached");
        assert_eq!(extract_boolean_capability_value(value), Some(false));
    }

    #[test]
    fn is_open_change_updates_cache_and_emits_alert() {
        let mut data = wds_device_data();
        let mut event = capability_event(json!({ "isOpen": true }));

        let alert = data.handle_socket_event(&mut event);

        let value = cached_value(&data, "device-1", "isOpen").unwrap();
        assert_eq!(extract_boolean_capability_value(value), Some(true));

        let alert = alert.expect("an open/close change on a WDS sensor must raise an alert");
        assert_eq!(alert.device_id, "device-1");
        assert_eq!(alert.device_name, "Front Door");
        assert!(alert.is_open);
    }

    #[test]
    fn is_open_without_change_does_not_emit_alert() {
        let mut data = wds_device_data();
        let mut event = capability_event(json!({ "isOpen": false }));

        let alert = data.handle_socket_event(&mut event);

        assert!(alert.is_none());
        let value = cached_value(&data, "device-1", "isOpen").unwrap();
        assert_eq!(extract_boolean_capability_value(value), Some(false));
    }

    #[test]
    fn temperature_event_updates_cached_value() {
        let mut data = wds_device_data();
        let mut event = capability_event(json!({ "temperature": 21.5 }));

        let _ = data.handle_socket_event(&mut event);

        let value = cached_value(&data, "device-1", "temperature").expect("temperature cached");
        match value {
            CapValueType::CapValueItem(item) => match item.value.as_ref().unwrap() {
                interaction::FieldValue::FloatValue(v) => {
                    assert!((*v - 21.5).abs() < f32::EPSILON)
                }
                other => panic!("unexpected value variant: {:?}", other),
            },
            other => panic!("unexpected cap value variant: {:?}", other),
        }
    }

    #[test]
    fn set_locations_links_device_and_location() {
        let mut data = wds_device_data();
        let locations: Vec<LocationResponse> = serde_json::from_value(json!([
            { "id": "loc-1", "config": { "name": "Hallway", "type": "Room" } }
        ]))
        .unwrap();

        data.set_locations(locations);

        let device = data.devices.get("device-1").unwrap();
        let location_data = device
            .location_data
            .as_ref()
            .expect("device should be linked to its location");
        assert_eq!(location_data.config.name, "Hallway");

        let location = data.locations.iter().find(|l| l.id == "loc-1").unwrap();
        assert_eq!(
            location.devices.as_deref(),
            Some(&["device-1".to_string()][..])
        );
    }
}

