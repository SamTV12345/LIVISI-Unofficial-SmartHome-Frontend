#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::{OpenApi, ToSchema};

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct OidcConfigDoc {
    pub authority: String,
    pub client_id: String,
    pub redirect_uri: String,
    pub scope: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum AuthModeDoc {
    None,
    Basic,
    Oidc,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ApiServerConfigDoc {
    pub auth_mode: AuthModeDoc,
    pub basic_auth: bool,
    pub oidc_configured: bool,
    pub oidc_config: Option<OidcConfigDoc>,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct HashDoc {
    pub hash: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ProductDoc {
    pub id: String,
    #[serde(rename = "type")]
    pub r#type: String,
    pub version: Option<String>,
    pub generic: Option<bool>,
    pub provisioned: Option<bool>,
    pub config: Option<Value>,
    pub state: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SunTimesDoc {
    pub geo_location: String,
    pub latitude: f64,
    pub longitude: f64,
    pub sunrise: Option<String>,
    pub sunset: Option<String>,
    pub next_sunrise: Option<String>,
    pub next_sunset: Option<String>,
    pub next_event_name: Option<String>,
    pub next_event_at: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct UsbStorageDoc {
    pub external_storage: bool,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityHistoryDoc {
    pub event_type: String,
    pub event_time: String,
    pub data_name: String,
    pub data_value: String,
    pub entity_id: String,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct LocationDoc {
    pub id: String,
    pub config: Value,
    pub tags: Option<Value>,
    pub devices: Option<Vec<String>>,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MessagePropertiesDoc {
    pub device_location: Option<String>,
    pub device_name: Option<String>,
    pub device_serial: Option<String>,
    pub namespace: Option<String>,
    pub requester_info: Option<String>,
    pub shc_remote_reboot_reason: Option<String>,
    pub read: Option<bool>,
    pub change_reason: Option<String>,
    pub expires_after_minutes: Option<i32>,
    pub timestamp: Option<String>,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct MessageResponseDoc {
    pub id: String,
    #[serde(rename = "type")]
    pub r#type: String,
    pub class: Option<String>,
    pub namespace: Option<String>,
    pub timestamp: String,
    pub read: bool,
    pub devices: Option<Vec<String>>,
    pub messages: Option<Vec<String>>,
    pub capabilities: Option<Vec<String>>,
    pub properties: Option<MessagePropertiesDoc>,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct MessageReadDoc {
    pub read: bool,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct EmailSettingsDoc {
    pub server_address: String,
    pub server_port_number: i32,
    pub email_username: String,
    pub email_password: String,
    pub recipient_list: Vec<String>,
    pub notifications_device_unreachable: bool,
    pub notification_device_low_battery: bool,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct EmailTestDoc {
    pub result: String,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct TelegramProviderConfigDoc {
    pub bot_token: String,
    pub chat_id: String,
    pub message_thread_id: Option<i64>,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct WebhookProviderConfigDoc {
    pub url: String,
    pub bearer_token: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum NotificationProviderConfigDoc {
    Telegram(TelegramProviderConfigDoc),
    Webhook(WebhookProviderConfigDoc),
}

impl Default for NotificationProviderConfigDoc {
    fn default() -> Self {
        Self::Telegram(TelegramProviderConfigDoc::default())
    }
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct SentrySettingsDoc {
    pub enabled: bool,
    pub monitored_device_ids: Vec<String>,
    pub provider: NotificationProviderConfigDoc,
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, ToSchema)]
pub struct SentryTestDoc {
    pub result: String,
}

#[utoipa::path(
    get,
    path = "/api/server",
    responses((status = 200, description = "Server config", body = ApiServerConfigDoc))
)]
fn get_api_server_doc() {}

#[utoipa::path(
    get,
    path = "/api/all",
    responses((status = 200, description = "All aggregated API data", body = Value))
)]
fn get_api_all_doc() {}

#[utoipa::path(
    get,
    path = "/status",
    responses((status = 200, description = "System status", body = Value))
)]
fn get_status_doc() {}

#[utoipa::path(
    get,
    path = "/product",
    responses((status = 200, description = "Installed products/drivers", body = [ProductDoc]))
)]
fn get_product_doc() {}

#[utoipa::path(
    get,
    path = "/product/hash",
    responses((status = 200, description = "Product hash", body = HashDoc))
)]
fn get_product_hash_doc() {}

#[utoipa::path(
    get,
    path = "/service/sun-times",
    responses((status = 200, description = "Sunrise / sunset times", body = SunTimesDoc))
)]
fn get_sun_times_doc() {}

#[utoipa::path(
    get,
    path = "/interaction",
    responses((status = 200, description = "Interactions", body = Value))
)]
fn get_interactions_doc() {}

#[utoipa::path(
    get,
    path = "/interaction/{id}",
    params(("id" = String, Path, description = "Interaction id")),
    responses((status = 200, description = "Single interaction", body = Value))
)]
fn get_interaction_doc() {}

#[utoipa::path(
    put,
    path = "/interaction/{id}",
    params(("id" = String, Path, description = "Interaction id")),
    request_body = Value,
    responses((status = 200, description = "Updated interaction", body = Value))
)]
fn put_interaction_doc() {}

#[utoipa::path(
    post,
    path = "/interaction/{id}/trigger",
    params(("id" = String, Path, description = "Interaction id")),
    responses((status = 200, description = "Trigger result", body = Value))
)]
fn trigger_interaction_doc() {}

#[utoipa::path(
    get,
    path = "/message",
    responses((status = 200, description = "Messages", body = [MessageResponseDoc]))
)]
fn get_messages_doc() {}

#[utoipa::path(
    get,
    path = "/location",
    responses((status = 200, description = "Locations", body = [LocationDoc]))
)]
fn get_locations_doc() {}

#[utoipa::path(
    post,
    path = "/location",
    request_body = LocationDoc,
    responses((status = 200, description = "Location created", body = LocationDoc))
)]
fn post_location_doc() {}

#[utoipa::path(
    get,
    path = "/location/{id}",
    params(("id" = String, Path, description = "Location id")),
    responses((status = 200, description = "Single location", body = LocationDoc))
)]
fn get_location_doc() {}

#[utoipa::path(
    put,
    path = "/location/{id}",
    params(("id" = String, Path, description = "Location id")),
    request_body = LocationDoc,
    responses((status = 200, description = "Location updated", body = LocationDoc))
)]
fn put_location_doc() {}

#[utoipa::path(
    delete,
    path = "/location/{id}",
    params(("id" = String, Path, description = "Location id")),
    responses((status = 200, description = "Location deleted", body = LocationDoc))
)]
fn delete_location_doc() {}

#[utoipa::path(
    get,
    path = "/message/{message_id}",
    params(("message_id" = String, Path, description = "Message id")),
    responses((status = 200, description = "Single message", body = MessageResponseDoc))
)]
fn get_message_doc() {}

#[utoipa::path(
    put,
    path = "/message/{message_id}",
    params(("message_id" = String, Path, description = "Message id")),
    request_body = MessageReadDoc,
    responses((status = 200, description = "Message updated", body = MessageResponseDoc))
)]
fn put_message_doc() {}

#[utoipa::path(
    delete,
    path = "/message/{message_id}",
    params(("message_id" = String, Path, description = "Message id")),
    responses((status = 200, description = "Message deleted"))
)]
fn delete_message_doc() {}

#[utoipa::path(
    get,
    path = "/usb_storage",
    responses((status = 200, description = "USB storage status", body = UsbStorageDoc))
)]
fn get_usb_storage_doc() {}

#[utoipa::path(
    get,
    path = "/unmount",
    responses((status = 200, description = "USB unmounted", body = String))
)]
fn unmount_doc() {}

#[utoipa::path(
    get,
    path = "/email/settings",
    responses((status = 200, description = "Email settings", body = EmailSettingsDoc))
)]
fn get_email_settings_doc() {}

#[utoipa::path(
    put,
    path = "/email/settings",
    request_body = EmailSettingsDoc,
    responses((status = 200, description = "Email settings updated"))
)]
fn put_email_settings_doc() {}

#[utoipa::path(
    get,
    path = "/email/test",
    responses((status = 200, description = "Email test result", body = EmailTestDoc))
)]
fn get_email_test_doc() {}

#[utoipa::path(
    get,
    path = "/sentry/settings",
    responses((status = 200, description = "Sentry settings", body = SentrySettingsDoc))
)]
fn get_sentry_settings_doc() {}

#[utoipa::path(
    put,
    path = "/sentry/settings",
    request_body = SentrySettingsDoc,
    responses((status = 200, description = "Sentry settings updated", body = SentrySettingsDoc))
)]
fn put_sentry_settings_doc() {}

#[utoipa::path(
    post,
    path = "/sentry/test",
    responses((status = 200, description = "Sentry notification test result", body = SentryTestDoc))
)]
fn post_sentry_test_doc() {}

#[utoipa::path(
    get,
    path = "/data/capability",
    params(
        ("entityId" = String, Query, description = "Entity id with capability suffix"),
        ("start" = String, Query, description = "Start timestamp ISO-8601"),
        ("end" = String, Query, description = "End timestamp ISO-8601"),
        ("page" = Option<i32>, Query, description = "Page number"),
        ("pagesize" = Option<i32>, Query, description = "Page size"),
        ("eventType" = Option<String>, Query, description = "Event type")
    ),
    responses((status = 200, description = "Capability history", body = [CapabilityHistoryDoc]))
)]
fn get_capability_history_doc() {}

#[derive(OpenApi)]
#[openapi(
    paths(
        get_api_server_doc,
        get_api_all_doc,
        get_status_doc,
        get_product_doc,
        get_product_hash_doc,
        get_sun_times_doc,
        get_interactions_doc,
        get_interaction_doc,
        put_interaction_doc,
        trigger_interaction_doc,
        get_locations_doc,
        post_location_doc,
        get_location_doc,
        put_location_doc,
        delete_location_doc,
        get_messages_doc,
        get_message_doc,
        put_message_doc,
        delete_message_doc,
        get_usb_storage_doc,
        unmount_doc,
        get_email_settings_doc,
        put_email_settings_doc,
        get_email_test_doc,
        get_sentry_settings_doc,
        put_sentry_settings_doc,
        post_sentry_test_doc,
        get_capability_history_doc
    ),
    components(
        schemas(
            OidcConfigDoc,
            AuthModeDoc,
            ApiServerConfigDoc,
            HashDoc,
            ProductDoc,
            SunTimesDoc,
            UsbStorageDoc,
            CapabilityHistoryDoc,
            LocationDoc,
            EmailSettingsDoc,
            EmailTestDoc,
            TelegramProviderConfigDoc,
            WebhookProviderConfigDoc,
            NotificationProviderConfigDoc,
            SentrySettingsDoc,
            SentryTestDoc,
            MessageResponseDoc,
            MessagePropertiesDoc,
            MessageReadDoc
        )
    ),
    tags(
        (name = "Frontend API", description = "Documented endpoints consumed by the React UI")
    )
)]
pub struct ApiDoc;
