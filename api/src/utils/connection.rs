use std::env::var;
use std::fs;
use std::process::exit;
use std::sync::Mutex;
use crate::models::token::{Token, TokenRequest};
use crate::utils::header_utils::HeaderUtils;
use crate::constants::constant_types::{SERVER_URL};
use crate::api_lib::capability::Capability;
use crate::api_lib::device::{Device};
use crate::api_lib::location::{Location};
use crate::api_lib::user_storage::UserStorage;
use crate::{CLIENT_DATA, lock_and_call, STORE_DATA};
use crate::api_lib::email::Email;
use crate::api_lib::message;
use crate::api_lib::status::Status;
use crate::models::client_data::ClientData;
use crate::store::{Data, Store};

#[derive(Clone)]
pub struct MemPrefill {
}


use clap::Parser;
use crate::api_lib::livisi_response_type::LivisResponseType;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Args {
    /// Name of the person to greet
    #[arg(short, long)]
    pub file: Option<String>,
}

impl MemPrefill {

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
                match e.json::<LivisResponseType<Token>>().await {
                    Ok(e) => {
                        match e {
                            LivisResponseType::Ok(e) => {
                                return Ok(e)
                            }
                            LivisResponseType::Err(e) => {
                                log::error!("Error: {}", e);
                                exit(1)
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("{}" ,e);
                        exit(1)
                    }
                }
            }
            Err(e)=>{
                log::error!("Error: {}", e);
            }
        }
        Err(())
    }


    pub async fn do_db_initialization(args: &Args){
        log::info!("Doing db initialization");

        let base_url = var(SERVER_URL).unwrap();


        match args.file.clone() {
            Some(e)=>{
                let _ = STORE_DATA.set(Store::new(Token::default()));
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
            None=>{
                let token = Self::get_token().await;

                if let Ok(t) = token {
                    match STORE_DATA.get() {
                        Some(e) => {
                            let mut store = e.token.lock();
                            let st = store.as_mut().unwrap();
                            st.clone_from(&t.clone());
                        }
                        None => {
                            let e = STORE_DATA.set(Store::new(t.clone()));
                            if e.is_err(){
                                log::error!("Error setting store data");
                            }
                        }
                    }


                    match CLIENT_DATA.get() {
                        Some(e) => {
                            let data = ClientData::new(t.clone().access_token);
                            let mut res = e.lock().unwrap();
                            res.client.clone_from(&data.client);
                            res.token.clone_from(&data.token);
                        }
                        None => {
                            let e = CLIENT_DATA.set(Mutex::new(ClientData::new(t.clone().access_token)));
                            if e.is_err(){
                                log::error!("Error setting client data");
                            }
                        }
                    }
                    let message = message::Message::new(&base_url);

                    let devices = Device::new(&base_url);
                    let capabilities = Capability::new(&base_url);
                    let locations = Location::new(&base_url);
                    let status = Status::new(&base_url);
                    let user_storage = UserStorage::new(&base_url);
                    let email = Email::new(&base_url);

                    let mut store_tmp = STORE_DATA.get();
                    let store = store_tmp.as_mut().unwrap();

                    let found_devices = devices.get_devices().await;
                    lock_and_call!(store, set_devices, found_devices);

                    let capabilities_found = capabilities.get_capabilities()
                        .await;
                    lock_and_call!(store, set_capabilities, capabilities_found);

                    let locations = locations.get_locations().await;
                    lock_and_call!(store, set_locations, locations);
                    let cap_state  = capabilities.get_all_capability_states().await;
                    lock_and_call!(store, set_capabilities_state, cap_state);

                    let user_storage_data = user_storage.get_user_storage()
                        .await;
                    let status = status.get_status().await;
                    lock_and_call!(store, set_status, status);
                    lock_and_call!(store, set_user_storage, user_storage_data);

                    let message_data = message.get_messages().await;
                    lock_and_call!(store, set_messages, message_data);

                    let email_data = email.get_email_settings().await;

                    lock_and_call!(store, set_email, email_data);
                }
            }
        }
    }
}
