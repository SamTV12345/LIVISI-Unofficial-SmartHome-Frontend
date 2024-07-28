use serde_derive::{Deserialize, Serialize};
use crate::CLIENT_DATA;

#[derive(Clone)]
pub struct Email {
    pub base_url: String,
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
pub struct EmailResponse {
    pub result: String
}

#[derive(Default,Serialize,Deserialize, Debug, Clone)]
pub struct EmailAPI {
    server_address: String,
    server_port_number: i32,
    email_username: String,
    email_password: String,
    recipient_list: Vec<String>,
    notifications_device_unreachable: bool,
    notification_device_low_battery: bool,
}


impl Email {
    pub fn new(server_url: &str) -> Self {
        Self {
            base_url: format!("{}{}", server_url, "/email")
        }
    }

    pub async fn get_email_settings(&self) -> EmailAPI {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.get(self.base_url.clone()+"/settings")
            .send()
            .await
            .unwrap();

            response
                .json::<EmailAPI>()
            .await
            .unwrap()
    }


    pub async fn update_email_settings(&self, email_data: &EmailAPI) -> u16 {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.put(self.base_url.clone()+"/settings")
            .json(&email_data)
            .send()
            .await
            .unwrap();

        response.status().as_u16()
    }

    pub async fn test_email(&self) -> EmailResponse {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        api_client.get(self.base_url.clone()+"/test")
            .send()
            .await
            .unwrap()
            .json::<EmailResponse>()
            .await
            .unwrap()
    }
}