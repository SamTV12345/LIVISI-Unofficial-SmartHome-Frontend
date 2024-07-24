use std::env::var;
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
use crate::models::client_data::ClientData;
use crate::store::Store;

#[derive(Clone)]
pub struct RedisConnection{
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
                println!("Error: {}", e);
            }
        }
        Err(())
    }

    pub async fn do_db_initialization(){
        println!("Doing db initialization");
        let token = Self::get_token().await.unwrap();

        STORE_DATA.get_or_init(|| Store::new(token.clone()));
        CLIENT_DATA.get_or_init(|| Mutex::new(ClientData::new(token.access_token)));

        let devices = Device::new(var(SERVER_URL).unwrap());
        let capabilities = Capability::new(var(SERVER_URL).unwrap());
        let locations = Location::new(var(SERVER_URL).unwrap());
        let user_storage = UserStorage::new(var(SERVER_URL).unwrap());
        let _client = ReqwestClient::new();
        let _client2 = ReqwestClient::new();

        let mut store_tmp = STORE_DATA.get();
        let store = store_tmp.as_mut().unwrap();
        let mut st = store.data.lock().unwrap();

        let found_devices = devices.get_devices().await;
        st.set_devices(found_devices);

        let capabilities_found = capabilities.get_capabilities()
            .await;
        st.set_capabilities(capabilities_found);

        let _client = ReqwestClient::new();
        let locations = locations.get_locations().await;

        st.set_locations(locations.clone());
        st.set_capabilities_state(capabilities.get_all_capability_states().await);
        let user_storage_data = user_storage.get_user_storage()
            .await;
        st.set_user_storage(user_storage_data);
    }
}
