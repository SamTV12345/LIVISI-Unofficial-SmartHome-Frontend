use serde_derive::{Deserialize, Serialize};

use crate::api_lib::livisi_response_type::LivisResponseType;
use crate::CLIENT_DATA;

#[derive(Clone)]
pub struct USBService {
    base_url: String,
    usb_status: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct USBStatus {
    pub external_storage: bool,
}

impl USBService {
    pub fn new(base_url: &str) -> Self {
        USBService {
            base_url: format!("{}{}", base_url, "/unmount"),
            usb_status: format!("{}{}", base_url, "/usb_storage")
        }
    }

    pub async fn unmount_usb_storage(&self) {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }

        api_client.get(self.base_url.clone())
           .send()
           .await.unwrap().text().await.unwrap();
    }

    pub async fn get_usb_status(&self) -> LivisResponseType<USBStatus> {
        let api_client;
        {
            let locked_client = CLIENT_DATA.get().unwrap().lock();
            api_client = locked_client.unwrap().client.clone()
        }
        let response = api_client.get(self.usb_status.clone())
            .send()
            .await.expect("Error getting USB status.");

        response.json::<LivisResponseType<USBStatus>>()
            .await
            .expect("Error parsing USB status.")
    }
}