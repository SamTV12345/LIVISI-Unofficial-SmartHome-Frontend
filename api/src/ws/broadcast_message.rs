use actix::Message;
use serde_derive::{Deserialize, Serialize};

#[derive(Message, Serialize, Deserialize)]
#[rtype(result = "()")]
pub struct BroadcastMessage {
    pub message: String,
}