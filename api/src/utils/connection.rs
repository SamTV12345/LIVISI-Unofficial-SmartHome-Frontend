use std::env;
use std::env::var;
use std::time::{SystemTime, UNIX_EPOCH};
use redis::{Client, Commands, Connection};
use crate::models::token::{Token, TokenRequest};
use crate::utils::header_utils::HeaderUtils;
use reqwest::Client as ReqwestClient;
use crate::constants::constants::{CAPABILITIES, DEVICES, LOCATIONS, REDIS_ENV, SERVER_URL, TOKEN};
use crate::lib::capability::Capability;
use crate::lib::device::Device;
use crate::lib::location::Location;

#[derive(Clone)]
pub struct RedisConnection{
}

impl RedisConnection{
    pub fn get_connection() -> Client {
        return Client::open(var(REDIS_ENV).unwrap()).unwrap();

    }

    pub fn get_redis_connection(client: Client) -> Connection {
        return client.get_connection().unwrap();
    }

    pub fn save_to_redis(mut client: Connection, key: &str, value: &str) {
        redis::cmd("SET").arg(key).arg(value).execute(&mut client);
    }

    pub fn get_from_redis(mut conn: Connection, key: &str) -> String {
        let res:redis::RedisResult<String> = redis::cmd("GET").arg(key).query(&mut conn);
        return res.unwrap();
    }

    pub fn save_token(mut conn: Connection, token: Token){
        let token_string = serde_json::to_string(&token).unwrap();
        RedisConnection::save_to_redis(conn, TOKEN, &token_string);
    }

    pub fn is_token_present(mut conn: Connection) -> bool {
        let res:redis::RedisResult<String> = redis::cmd("GET").arg("token").query(&mut conn);
        return res.is_ok();
    }

    pub async fn get_token() -> Token{
        let client = reqwest::Client::new();
        let auth_url = var("BASE_URL").unwrap() + "/auth/token";
        let result = client.post(auth_url)
            .headers(HeaderUtils::get_headers())
            .json::<TokenRequest>(&TokenRequest::default())
            .send()
            .await;

        let response = result.unwrap();


       return  response.json::<Token>().await
            .unwrap();
    }

    pub async fn do_db_initialization(){
        println!("Doing db initialization");
        let mut conn = RedisConnection::get_connection();
        let is_token_present = RedisConnection::is_token_present(conn.get_connection().unwrap());
        let mut token = Token::default();
        match is_token_present {
            true => {
                let token_string = RedisConnection::get_from_redis(conn.get_connection().unwrap(),
                                                              TOKEN);
                serde_json::from_str(&token_string).map(|t| token = t).unwrap();
                if (token.created_at.0+token.expires_in as u64)<SystemTime::now().duration_since
                (UNIX_EPOCH).unwrap().as_secs(){
                    token = RedisConnection::get_token().await;
                    RedisConnection::save_token(conn.get_connection().unwrap(), token.clone());
                }
            },
            false => {
                println!("Token is not present");
                token = RedisConnection::get_token().await;
                RedisConnection::save_token(conn.get_connection().unwrap(), token.clone());
            }
        }
        let devices = Device::new(var(SERVER_URL).unwrap());
        let capabilities = Capability::new(var(SERVER_URL).unwrap());
        let locations = Location::new(var(SERVER_URL).unwrap());

        let client = ReqwestClient::new();
        let client2 = ReqwestClient::new();

        let found_devices = devices.get_devices(client2, token.access_token.clone()).await;

        Self::save_to_redis(conn.get_connection().unwrap(),DEVICES, &serde_json::to_string
            (&found_devices).unwrap());

        let capabilities = capabilities.get_capabilities(client.clone(), token.access_token.clone())
            .await;

        Self::save_to_redis(conn.get_connection().unwrap(),CAPABILITIES, &serde_json::to_string
            (&capabilities).unwrap());

        let client = ReqwestClient::new();
        let locations = locations.get_locations(client, token.access_token).await;
        Self::save_to_redis(conn.get_connection().unwrap(),LOCATIONS, &serde_json::to_string
            (&locations).unwrap());

    }
}
