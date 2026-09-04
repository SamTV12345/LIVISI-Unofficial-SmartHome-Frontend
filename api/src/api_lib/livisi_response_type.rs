use serde_derive::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum LivisResponseType<T> {
    Ok(T),
    Err(ErrorConstruct),
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct ErrorConstruct {
    pub errorcode: i32,
    pub description: String,
    pub messages: Vec<String>,
}

impl Display for ErrorConstruct {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "ErrorConstruct: errorcode: {}, description: {}, messages: {:?}",
            self.errorcode, self.description, self.messages
        )
    }
}
