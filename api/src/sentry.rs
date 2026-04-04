use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;
use std::sync::{Arc, Mutex};
use std::thread;
use tokio_postgres::{Client, NoTls};

const DEFAULT_SENTRY_SETTINGS_ID: &str = "default";
const DEFAULT_DATABASE_URL: &str = "postgres://smarthome:smarthome@postgres:5432/smarthome";

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct SentrySettings {
    pub enabled: bool,
    #[serde(default)]
    pub monitored_device_ids: Vec<String>,
    #[serde(default)]
    pub provider: NotificationProviderConfig,
}

impl SentrySettings {
    pub fn validate_for_save(&self) -> Result<(), String> {
        if self.enabled {
            self.provider.validate()?;
        }
        Ok(())
    }

    pub fn validate_for_send(&self) -> Result<(), String> {
        self.provider.validate()
    }

    fn monitors_device(&self, device_id: &str) -> bool {
        self.monitored_device_ids.is_empty()
            || self
                .monitored_device_ids
                .iter()
                .any(|configured_device_id| configured_device_id == device_id)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum NotificationProviderConfig {
    Telegram(TelegramProviderConfig),
    Webhook(WebhookProviderConfig),
}

impl Default for NotificationProviderConfig {
    fn default() -> Self {
        Self::Telegram(TelegramProviderConfig::default())
    }
}

impl NotificationProviderConfig {
    fn validate(&self) -> Result<(), String> {
        match self {
            NotificationProviderConfig::Telegram(config) => {
                if config.bot_token.trim().is_empty() {
                    return Err("Telegram bot token is required.".to_string());
                }
                if config.chat_id.trim().is_empty() {
                    return Err("Telegram chat id is required.".to_string());
                }
                Ok(())
            }
            NotificationProviderConfig::Webhook(config) => {
                if config.url.trim().is_empty() {
                    return Err("Webhook URL is required.".to_string());
                }
                Ok(())
            }
        }
    }

    fn provider_name(&self) -> &'static str {
        match self {
            NotificationProviderConfig::Telegram(_) => "telegram",
            NotificationProviderConfig::Webhook(_) => "webhook",
        }
    }
}

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct TelegramProviderConfig {
    pub bot_token: String,
    pub chat_id: String,
    pub message_thread_id: Option<i64>,
}

#[derive(Default, Serialize, Deserialize, Debug, Clone)]
pub struct WebhookProviderConfig {
    pub url: String,
    pub bearer_token: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SentryAlert {
    pub device_id: String,
    pub device_name: String,
    pub location_name: Option<String>,
    pub is_open: bool,
    pub occurred_at: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct NotificationPayload {
    pub event: &'static str,
    pub provider: &'static str,
    pub text: String,
    pub device_id: String,
    pub device_name: String,
    pub location_name: Option<String>,
    pub is_open: bool,
    pub occurred_at: String,
}

impl NotificationPayload {
    fn from_alert(provider: &'static str, alert: &SentryAlert) -> Self {
        let action_text = if alert.is_open { "opened" } else { "closed" };
        let location = alert
            .location_name
            .as_ref()
            .map(|value| format!(" in {}", value))
            .unwrap_or_default();

        Self {
            event: "sentry_sensor_changed",
            provider,
            text: format!(
                "Sentry mode: {}{} was {} at {}.",
                alert.device_name, location, action_text, alert.occurred_at
            ),
            device_id: alert.device_id.clone(),
            device_name: alert.device_name.clone(),
            location_name: alert.location_name.clone(),
            is_open: alert.is_open,
            occurred_at: alert.occurred_at.clone(),
        }
    }
}

trait NotificationProvider {
    fn send(&self, payload: &NotificationPayload) -> Result<(), String>;
}

struct TelegramNotificationProvider {
    config: TelegramProviderConfig,
    client: reqwest::blocking::Client,
}

impl NotificationProvider for TelegramNotificationProvider {
    fn send(&self, payload: &NotificationPayload) -> Result<(), String> {
        let endpoint = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.config.bot_token
        );

        let body = build_telegram_body(&self.config, payload);

        let response = self
            .client
            .post(endpoint)
            .json(&body)
            .send()
            .map_err(|err| format!("Could not send Telegram notification: {}", err))?;

        let status = response.status();
        let response_body = response.text().unwrap_or_default();

        if status.is_success() {
            return Ok(());
        }

        Err(format!(
            "Telegram notification failed with status {}: {}",
            status,
            response_body
        ))
    }
}

struct WebhookNotificationProvider {
    config: WebhookProviderConfig,
    client: reqwest::blocking::Client,
}

impl NotificationProvider for WebhookNotificationProvider {
    fn send(&self, payload: &NotificationPayload) -> Result<(), String> {
        let mut request = self.client.post(&self.config.url).json(payload);
        if !self.config.bearer_token.trim().is_empty() {
            request = request.bearer_auth(&self.config.bearer_token);
        }

        let response = request
            .send()
            .map_err(|err| format!("Could not send webhook notification: {}", err))?;

        if response.status().is_success() {
            return Ok(());
        }

        Err(format!(
            "Webhook notification failed with status {}",
            response.status()
        ))
    }
}

#[derive(Clone)]
pub struct SentryService {
    repository: Arc<SentryRepository>,
    settings: Arc<Mutex<SentrySettings>>,
}

impl SentryService {
    pub async fn new() -> Result<Self, String> {
        let repository = Arc::new(SentryRepository::connect().await?);
        let settings = repository.load_settings().await?;

        Ok(Self {
            repository,
            settings: Arc::new(Mutex::new(settings)),
        })
    }

    pub fn get_settings(&self) -> SentrySettings {
        self.settings
            .lock()
            .map(|settings| settings.clone())
            .unwrap_or_default()
    }

    pub async fn update_settings(&self, settings: SentrySettings) -> Result<SentrySettings, String> {
        settings.validate_for_save()?;
        self.repository.save_settings(&settings).await?;

        if let Ok(mut current_settings) = self.settings.lock() {
            current_settings.clone_from(&settings);
        }

        Ok(settings)
    }

    pub fn dispatch_alert(&self, alert: SentryAlert) {
        let settings = self.get_settings();
        if !settings.enabled || !settings.monitors_device(&alert.device_id) {
            return;
        }

        if let Err(err) = settings.validate_for_send() {
            log::warn!("Skipping sentry notification because provider configuration is invalid: {}", err);
            return;
        }

        thread::spawn(move || {
            if let Err(err) = send_notification(&settings.provider, &alert) {
                log::error!("Could not dispatch sentry notification: {}", err);
            }
        });
    }

    pub async fn test_notification(&self) -> Result<(), String> {
        let settings = self.get_settings();
        settings.validate_for_send()?;

        let alert = SentryAlert {
            device_id: "test-device".to_string(),
            device_name: "Front Door".to_string(),
            location_name: Some("Entrance".to_string()),
            is_open: true,
            occurred_at: chrono::Utc::now().to_rfc3339(),
        };

        send_notification_async(&settings.provider, &alert).await
    }
}

fn send_notification(
    provider_config: &NotificationProviderConfig,
    alert: &SentryAlert,
) -> Result<(), String> {
    let client = reqwest::blocking::Client::new();
    let provider_name = provider_config.provider_name();
    let payload = NotificationPayload::from_alert(provider_name, alert);

    match provider_config {
        NotificationProviderConfig::Telegram(config) => TelegramNotificationProvider {
            config: config.clone(),
            client,
        }
        .send(&payload),
        NotificationProviderConfig::Webhook(config) => WebhookNotificationProvider {
            config: config.clone(),
            client,
        }
        .send(&payload),
    }
}

async fn send_notification_async(
    provider_config: &NotificationProviderConfig,
    alert: &SentryAlert,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let provider_name = provider_config.provider_name();
    let payload = NotificationPayload::from_alert(provider_name, alert);

    match provider_config {
        NotificationProviderConfig::Telegram(config) => {
            let endpoint = format!(
                "https://api.telegram.org/bot{}/sendMessage",
                config.bot_token
            );

            let body = build_telegram_body(config, &payload);

            let response = client
                .post(endpoint)
                .json(&body)
                .send()
                .await
                .map_err(|err| format!("Could not send Telegram notification: {}", err))?;

            let status = response.status();
            let response_body = response.text().await.unwrap_or_default();

            if status.is_success() {
                Ok(())
            } else {
                Err(format!(
                    "Telegram notification failed with status {}: {}",
                    status,
                    response_body
                ))
            }
        }
        NotificationProviderConfig::Webhook(config) => {
            let mut request = client.post(&config.url).json(&payload);
            if !config.bearer_token.trim().is_empty() {
                request = request.bearer_auth(&config.bearer_token);
            }

            let response = request
                .send()
                .await
                .map_err(|err| format!("Could not send webhook notification: {}", err))?;

            if response.status().is_success() {
                Ok(())
            } else {
                Err(format!(
                    "Webhook notification failed with status {}",
                    response.status()
                ))
            }
        }
    }
}

fn build_telegram_body(
    config: &TelegramProviderConfig,
    payload: &NotificationPayload,
) -> serde_json::Value {
    let mut body = serde_json::Map::new();
    body.insert("chat_id".to_string(), json!(config.chat_id));
    body.insert("text".to_string(), json!(payload.text));

    if let Some(message_thread_id) = config.message_thread_id {
        body.insert("message_thread_id".to_string(), json!(message_thread_id));
    }

    serde_json::Value::Object(body)
}

struct SentryRepository {
    client: Client,
}

impl SentryRepository {
    async fn connect() -> Result<Self, String> {
        let database_url =
            env::var("DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string());
        let (client, connection) = tokio_postgres::connect(&database_url, NoTls)
            .await
            .map_err(|err| format!("Could not connect to Postgres: {}", err))?;

        tokio::spawn(async move {
            if let Err(err) = connection.await {
                log::error!("Postgres connection error: {}", err);
            }
        });

        client
            .batch_execute(
                "
                create table if not exists sentry_settings (
                    id text primary key,
                    config jsonb not null,
                    updated_at timestamptz not null default now()
                );
                ",
            )
            .await
            .map_err(|err| format!("Could not create sentry_settings table: {}", err))?;

        Ok(Self { client })
    }

    async fn load_settings(&self) -> Result<SentrySettings, String> {
        let row = self
            .client
            .query_opt(
                "select config from sentry_settings where id = $1",
                &[&DEFAULT_SENTRY_SETTINGS_ID],
            )
            .await
            .map_err(|err| format!("Could not load sentry settings: {}", err))?;

        if let Some(row) = row {
            let value: serde_json::Value = row.get("config");
            return serde_json::from_value::<SentrySettings>(value)
                .map_err(|err| format!("Could not deserialize sentry settings: {}", err));
        }

        let settings = SentrySettings::default();
        self.save_settings(&settings).await?;
        Ok(settings)
    }

    async fn save_settings(&self, settings: &SentrySettings) -> Result<(), String> {
        let value = serde_json::to_value(settings)
            .map_err(|err| format!("Could not serialize sentry settings: {}", err))?;

        self.client
            .execute(
                "
                insert into sentry_settings (id, config, updated_at)
                values ($1, $2, now())
                on conflict (id) do update
                set config = excluded.config,
                    updated_at = excluded.updated_at
                ",
                &[&DEFAULT_SENTRY_SETTINGS_ID, &value],
            )
            .await
            .map_err(|err| format!("Could not save sentry settings: {}", err))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::{NotificationProviderConfig, SentrySettings, TelegramProviderConfig};

    #[test]
    fn sentry_settings_allow_disabled_empty_provider() {
        let settings = SentrySettings::default();
        assert!(settings.validate_for_save().is_ok());
    }

    #[test]
    fn enabled_telegram_requires_credentials() {
        let settings = SentrySettings {
            enabled: true,
            monitored_device_ids: Vec::new(),
            provider: NotificationProviderConfig::Telegram(TelegramProviderConfig::default()),
        };

        assert!(settings.validate_for_save().is_err());
    }
}
