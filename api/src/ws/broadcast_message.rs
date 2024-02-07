use actix::Message;
use serde_derive::{Deserialize, Serialize};
use crate::models::socket_event::SocketEvent;

#[derive(Message, Serialize, Deserialize)]
#[rtype(result = "()")]
pub struct BroadcastMessage {
    pub message: SocketEvent,
}