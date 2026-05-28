use std::env::var;
use std::fs;
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
use crate::api_lib::interaction::Interaction;
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
#[derive(Parser, Debug, Clone)]
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
                                log::error!("Livisi rejected token request: {}", e);
                                return Err(());
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Could not parse Livisi token response: {}" ,e);
                        return Err(());
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
                    let interaction = Interaction::new(&base_url);

                    let devices = Device::new(&base_url);
                    let capabilities = Capability::new(&base_url);
                    let locations = Location::new(&base_url);
                    let status = Status::new(&base_url);
                    let user_storage = UserStorage::new(&base_url);
                    let email = Email::new(&base_url);

                    let mut store_tmp = STORE_DATA.get();
                    let store = store_tmp.as_mut().unwrap();

                    // Refresh each resource independently. A transient upstream
                    // failure (network blip, firmware update returning garbage, etc.)
                    // must not crash the gateway nor wipe the cache: on error we log
                    // and keep whatever was cached before, then retry on the next tick.
                    macro_rules! refresh {
                        ($fetch:expr, $setter:ident, $label:literal) => {
                            match $fetch.await {
                                Ok(value) => lock_and_call!(store, $setter, value),
                                Err(err) => log::error!(
                                    "Failed to refresh {} from Livisi, keeping cached data: {}",
                                    $label,
                                    err
                                ),
                            }
                        };
                    }

                    // Devices must be refreshed before the joins below (locations,
                    // capabilities, capability states all attach onto the device map).
                    refresh!(devices.get_devices(), set_devices, "devices");
                    refresh!(capabilities.get_capabilities(), set_capabilities, "capabilities");
                    refresh!(locations.get_locations(), set_locations, "locations");
                    refresh!(
                        capabilities.get_all_capability_states(),
                        set_capabilities_state,
                        "capability states"
                    );
                    refresh!(user_storage.get_user_storage(), set_user_storage, "user storage");
                    refresh!(status.get_status(), set_status, "status");
                    refresh!(message.get_messages(), set_messages, "messages");
                    refresh!(email.get_email_settings(), set_email, "email settings");
                    refresh!(interaction.get_interaction(), set_interactions, "interactions");
                }
            }
        }
    }
}
