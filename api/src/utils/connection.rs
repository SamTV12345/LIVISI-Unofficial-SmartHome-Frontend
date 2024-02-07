use std::collections::HashMap;
use std::env::var;

use std::time::{SystemTime, UNIX_EPOCH};
use redis::{Client, Connection};
use crate::models::token::{Token, TokenRequest};
use crate::utils::header_utils::HeaderUtils;
use reqwest::Client as ReqwestClient;
use crate::constants::constants::{CAPABILITIES, DEVICES, LOCATION_URL, LOCATIONS, REDIS_ENV, SERVER_URL, TOKEN, USER_STORAGE};
use crate::api_lib::capability::Capability;
use crate::api_lib::device::{Device, DevicePost};
use crate::api_lib::location::{Location, LocationResponse};
use crate::api_lib::user_storage::UserStorage;
use crate::CLIENT_DATA;
use crate::models::client_data::ClientData;

#[derive(Clone)]
pub struct RedisConnection{
}

impl RedisConnection{
    pub fn get_connection() -> Client {
        Client::open(var(REDIS_ENV).unwrap()).unwrap()

    }

    pub fn get_redis_connection(client: Client) -> Connection {
        client.get_connection().unwrap()
    }

    pub fn save_to_redis(mut client: Connection, key: &str, value: &str) {
        redis::cmd("SET").arg(key).arg(value).execute(&mut client);
    }

    pub fn get_from_redis(mut conn: Connection, key: &str) -> String {
        let res:redis::RedisResult<String> = redis::cmd("GET").arg(key).query(&mut conn);
        res.unwrap()
    }

    pub fn save_token(conn: Connection, token: Token){
        {
            let data = CLIENT_DATA.get().unwrap().lock();
            *data.unwrap() = ClientData::new(token.access_token.clone());
        }
        let token_string = serde_json::to_string(&token).unwrap();
        RedisConnection::save_to_redis(conn, TOKEN, &token_string);
    }

    pub fn is_token_present(mut conn: Connection) -> bool {
        let res:redis::RedisResult<String> = redis::cmd("GET").arg("token").query(&mut conn);
        res.is_ok()
    }

    pub async fn get_token() -> Result<Token, ()>{
        let client = reqwest::Client::new();
        let auth_url = var("BASE_URL").unwrap() + "/auth/token";
        let result = client.post(auth_url)
            .headers(HeaderUtils::get_headers())
            .json::<TokenRequest>(&TokenRequest::default())
            .send()
            .await;

        let response = result;
        match response {
            Ok(e)=>{
                return  Ok(e.json::<Token>().await.unwrap());
            }
            Err(e)=>{
                println!("Error: {}", e);
            }
        }
        Err(())
    }

    pub async fn do_db_initialization(){
        println!("Doing db initialization");
        let conn = RedisConnection::get_connection();
        let is_token_present = RedisConnection::is_token_present(conn.get_connection().unwrap());
        let mut token = Token::default();
        match is_token_present {
            true => {
                let token_string = RedisConnection::get_from_redis(conn.get_connection().unwrap(),
                                                              TOKEN);
                serde_json::from_str(&token_string).map(|t| token = t).unwrap();
                if (token.created_at.0+token.expires_in as u64)<SystemTime::now().duration_since
                (UNIX_EPOCH).unwrap().as_secs(){
                    token = Self::get_token().await.unwrap();
                    RedisConnection::save_token(conn.get_connection().unwrap(), token.clone());
                }
            },
            false => {
                println!("Token is not present");
                token = RedisConnection::get_token().await.unwrap();
                RedisConnection::save_token(conn.get_connection().unwrap(), token.clone());
            }
        }
        let devices = Device::new(var(SERVER_URL).unwrap());
        let capabilities = Capability::new(var(SERVER_URL).unwrap());
        let locations = Location::new(var(SERVER_URL).unwrap());
        let user_storage = UserStorage::new(var(SERVER_URL).unwrap());
        let _client = ReqwestClient::new();
        let _client2 = ReqwestClient::new();



        let capabilities = capabilities.get_capabilities()
            .await;

        Self::save_to_redis(conn.get_connection().unwrap(),CAPABILITIES, &serde_json::to_string
            (&capabilities).unwrap());

        let _client = ReqwestClient::new();
        let mut locations = locations.get_locations().await;

        let mut found_devices = devices.get_devices().await;

        let mut map:HashMap<String, LocationResponse> = HashMap::new();
        let mut map_of_location_to_device:HashMap<String, Vec<DevicePost>> = HashMap::new();

        for location in locations.clone() {
            map.insert(LOCATION_URL.to_owned()+&location.id.clone(), location);
        }


        found_devices.0.iter_mut().for_each(|device| {
            if device.location.is_some(){
                let opt_location = map.get(&device.location.clone().unwrap());
                if opt_location.is_some(){
                    let wrapped = opt_location.unwrap();
                    match map_of_location_to_device.get(&wrapped.id).is_some(){
                        true=>{
                            map_of_location_to_device.get_mut(&wrapped.id).unwrap().push(device.clone());
                        },
                        false=>{
                            map_of_location_to_device.insert(wrapped.id.clone(), vec![device.clone()]);
                        }
                    }

                    // Prevent recursion
                    device.location_data = Some(LocationResponse{
                        id: wrapped.id.clone(),
                        config: wrapped.config.clone(),
                        devices: None
                    });
                }
            }
        });

        locations.iter_mut().for_each(|location| {
            if map_of_location_to_device.get(&location.id).is_some(){
                location.devices = Some(map_of_location_to_device.get(&location.id).unwrap().clone());
            }
        });

        Self::save_to_redis(conn.get_connection().unwrap(),LOCATIONS, &serde_json::to_string
            (&locations).unwrap());
        Self::save_to_redis(conn.get_connection().unwrap(),DEVICES, &serde_json::to_string
            (&found_devices.clone()).unwrap());
        let client = ReqwestClient::new();
        let user_storage_data = user_storage.get_user_storage(client, token.access_token.clone())
            .await;
        Self::save_to_redis(conn.get_connection().unwrap(),USER_STORAGE, &serde_json::to_string
            (&user_storage_data).unwrap());
    }
}
