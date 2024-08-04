use serde_derive::Serialize;
use serde_derive::Deserialize;
use crate::constants::constant_types::{PASSWORD, USERNAME};

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
pub struct Token {
    pub access_token: String,
    pub expires_in: u32,
    pub refresh_token: String,
    pub token_type: String,
    #[serde(default)]
    pub created_at: CreatedAt
}

#[derive(Serialize,Deserialize, Debug,Clone)]
#[derive(Default)]
pub struct CreatedAt(pub u64);


#[derive(Serialize,Deserialize, Debug, Clone)]
pub struct TokenRequest{
    grant_type: String,
    pub password: String,
    pub username: String
}


impl Default for TokenRequest {
    fn default() -> Self {
        Self {
            grant_type: "password".to_string(),
            password: std::env::var(PASSWORD).expect("Password for Livisi API is not set").trim().to_string(),
            username: std::env::var(USERNAME).unwrap_or("admin".to_string()).trim().to_string()
        }
    }
}