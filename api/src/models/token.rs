use serde_derive::Serialize;
use serde_derive::Deserialize;

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
pub struct CreatedAt(pub u64);
impl Default for CreatedAt {
    fn default() -> Self {
        CreatedAt(0)
    }
}

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
            password: std::env::var("PASSWORD").unwrap(),
            username: std::env::var("USERNAME").unwrap()
        }
    }
}