use std::env::var;
use std::fs;
use std::sync::Mutex;
use crate::models::token::{Token, TokenRequest};
use crate::utils::header_utils::HeaderUtils;
use reqwest::Client as ReqwestClient;
use crate::constants::constants::{SERVER_URL};
use crate::api_lib::capability::Capability;
use crate::api_lib::device::{Device};
use crate::api_lib::location::{Location};
use crate::api_lib::user_storage::UserStorage;
use crate::{CLIENT_DATA, STORE_DATA};
use crate::api_lib::email::Email;
use crate::api_lib::message;
use crate::api_lib::status::Status;
use crate::models::client_data::ClientData;
use crate::store::{Data, Store};

#[derive(Clone)]
pub struct RedisConnection{
}


use clap::Parser;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Name of the person to greet
    #[arg(short, long)]
    file: Option<String>,
}

impl RedisConnection{

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
                log::error!("Error: {}", e);
            }
        }
        Err(())
    }


    pub async fn do_db_initialization(){
        let args = Args::parse();


        log::info!("Doing db initialization");

        let token = Self::get_token().await.unwrap();
        let base_url = var(SERVER_URL).unwrap();

        match STORE_DATA.get() {
            Some(e) => {
                let mut store = e.token.lock();
                let st = store.as_mut().unwrap();
                st.clone_from(&token.clone());
            }
            None => {
                let e = STORE_DATA.set(Store::new(token.clone()));
                if e.is_err(){
                    log::error!("Error setting store data");
                }
            }
        }


        match CLIENT_DATA.get() {
            Some(e) => {
                let data = ClientData::new(token.clone().access_token);
                let mut res = e.lock().unwrap();
                res.client.clone_from(&data.client);
                res.token.clone_from(&data.token);
            }
            None => {
                let e = CLIENT_DATA.set(Mutex::new(ClientData::new(token.clone().access_token)));
                if e.is_err(){
                    log::error!("Error setting client data");
                }
            }
        }


        match args.file {
            Some(e) => {
                log::info!("Reading from file: {}", e);
                match fs::read_to_string(e) {
                    Ok(e) => {
                        let mut store = STORE_DATA.get();
                        let mut st = store.as_mut().unwrap().data.lock().unwrap();
                        let data = serde_json::from_str::<Data>(&e);
                        match data {
                            Ok(e) => {
                                st.clone_from(&e);
                            }
                            Err(e) => {
                                log::error!("Error: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Error: {}", e);
                    }
                }
            }
            None => {
                let message = message::Message::new(&base_url);

                let devices = Device::new(&base_url);
                let capabilities = Capability::new(&base_url);
                let locations = Location::new(&base_url);
                let status = Status::new(&base_url);
                let user_storage = UserStorage::new(&base_url);
                let email = Email::new(&base_url);

                let mut store_tmp = STORE_DATA.get();
                let store = store_tmp.as_mut().unwrap();
                let mut st = store.data.lock().unwrap();

                let found_devices = devices.get_devices().await;
                st.set_devices(found_devices);

                let capabilities_found = capabilities.get_capabilities()
                    .await;
                st.set_capabilities(capabilities_found);

                let locations = locations.get_locations().await;

                st.set_locations(locations.clone());
                st.set_capabilities_state(capabilities.get_all_capability_states().await);
                let user_storage_data = user_storage.get_user_storage()
                    .await;
                st.set_status(status.get_status().await);
                st.set_user_storage(user_storage_data);

                let message_data = message.get_messages().await;
                st.set_messages(message_data);

                let email_data = email.get_email_settings().await;
                st.set_email(email_data);
            }
        }
    }
}
