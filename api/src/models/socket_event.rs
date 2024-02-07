use std::collections::HashMap;
use serde_derive::{Deserialize, Serialize};
use crate::api_lib::interaction::FieldValue;

#[derive(Default,Serialize,Deserialize, Debug)]
pub struct SocketEvent {
    r#type: String,
    namespace: String,
    desc: String,
    source: String,
    timestamp: String,
    properties: Option<HashMap<String, FieldValue>>,
    context: Option<HashMap<String, FieldValue>>
}