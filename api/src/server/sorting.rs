use serde_json::Value;
use std::cmp::Ordering;
use std::collections::HashMap;

use crate::api_lib::interaction::InteractionResponse;
use crate::api_lib::location::LocationResponse;
use crate::store::{Data, DeviceStore};

fn normalized_sort_key(value: &str) -> String {
    value.trim().to_lowercase()
}

fn device_display_name(device_id: &str, device: &DeviceStore) -> String {
    device
        .config
        .as_ref()
        .and_then(|config| config.name.clone())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| device_id.to_string())
}

fn canonical_device_id(device_id: &str) -> &str {
    device_id.strip_prefix("/device/").unwrap_or(device_id)
}

fn compare_devices(
    left_id: &str,
    left_device: &DeviceStore,
    right_id: &str,
    right_device: &DeviceStore,
) -> Ordering {
    let left_name = normalized_sort_key(&device_display_name(left_id, left_device));
    let right_name = normalized_sort_key(&device_display_name(right_id, right_device));
    left_name
        .cmp(&right_name)
        .then_with(|| left_id.cmp(right_id))
}

pub(crate) fn sorted_devices_map_value(devices: &HashMap<String, DeviceStore>) -> Value {
    let mut entries: Vec<(&String, &DeviceStore)> = devices.iter().collect();
    entries.sort_by(|(left_id, left_device), (right_id, right_device)| {
        compare_devices(left_id, left_device, right_id, right_device)
    });

    let mut sorted_map = serde_json::Map::new();
    for (device_id, device) in entries {
        match serde_json::to_value(device) {
            Ok(device_value) => {
                sorted_map.insert(device_id.clone(), device_value);
            }
            Err(err) => {
                log::warn!("Could not serialize device {}: {}", device_id, err);
            }
        }
    }

    Value::Object(sorted_map)
}

pub(crate) fn sorted_locations(
    locations: &[LocationResponse],
    devices: &HashMap<String, DeviceStore>,
) -> Vec<LocationResponse> {
    let mut sorted_locations = locations.to_vec();
    sorted_locations.sort_by(|left, right| {
        normalized_sort_key(&left.config.name)
            .cmp(&normalized_sort_key(&right.config.name))
            .then_with(|| left.id.cmp(&right.id))
    });

    for location in &mut sorted_locations {
        if let Some(device_ids) = location.devices.as_mut() {
            device_ids.sort_by(|left_id, right_id| {
                let left_canonical = canonical_device_id(left_id);
                let right_canonical = canonical_device_id(right_id);
                let left_device = devices.get(left_canonical);
                let right_device = devices.get(right_canonical);

                match (left_device, right_device) {
                    (Some(left_device), Some(right_device)) => {
                        compare_devices(left_canonical, left_device, right_canonical, right_device)
                    }
                    (Some(_), None) => Ordering::Less,
                    (None, Some(_)) => Ordering::Greater,
                    (None, None) => {
                        normalized_sort_key(left_id).cmp(&normalized_sort_key(right_id))
                    }
                }
            });
            device_ids.dedup();
        }
    }

    sorted_locations
}

pub(crate) fn sorted_interactions(interactions: &[InteractionResponse]) -> Vec<InteractionResponse> {
    let mut sorted_interactions = interactions.to_vec();
    sorted_interactions.sort_by(|left, right| {
        let left_name = normalized_sort_key(left.name.as_deref().unwrap_or(&left.id));
        let right_name = normalized_sort_key(right.name.as_deref().unwrap_or(&right.id));
        left_name
            .cmp(&right_name)
            .then_with(|| left.id.cmp(&right.id))
    });
    sorted_interactions
}

pub(crate) fn sorted_data_value(data: &Data) -> Value {
    let mut value = match serde_json::to_value(data) {
        Ok(value) => value,
        Err(err) => {
            log::warn!("Could not serialize /api/all payload: {}", err);
            Value::Object(serde_json::Map::new())
        }
    };

    if let Value::Object(map) = &mut value {
        map.insert(
            "devices".to_string(),
            sorted_devices_map_value(&data.devices),
        );
        map.insert(
            "locations".to_string(),
            serde_json::to_value(sorted_locations(&data.locations, &data.devices))
                .unwrap_or(Value::Array(Vec::new())),
        );
        map.insert(
            "interactions".to_string(),
            serde_json::to_value(sorted_interactions(&data.interactions))
                .unwrap_or(Value::Array(Vec::new())),
        );
    }

    value
}
