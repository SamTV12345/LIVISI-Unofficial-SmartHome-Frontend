use serde_json::Value;
use std::env;
use tokio_postgres::{Client, NoTls};

use crate::store::Data;

const DEFAULT_DATABASE_URL: &str = "postgres://smarthome:smarthome@postgres:5432/smarthome";

/// Persists periodic snapshots of the gateway's cached LIVISI configuration
/// (devices, capabilities, locations, interactions) as JSON in Postgres, so a
/// broken/empty SHC can be restored from the last known good state.
pub struct BackupRepository {
    client: Client,
}

impl BackupRepository {
    pub async fn connect() -> Result<Self, String> {
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
                create table if not exists config_snapshots (
                    id bigserial primary key,
                    captured_at timestamptz not null default now(),
                    config jsonb not null
                );
                ",
            )
            .await
            .map_err(|err| format!("Could not create config_snapshots table: {}", err))?;

        Ok(Self { client })
    }

    pub async fn save_snapshot(&self, config: &Value) -> Result<(), String> {
        self.client
            .execute(
                "insert into config_snapshots (config) values ($1)",
                &[config],
            )
            .await
            .map_err(|err| format!("Could not save config snapshot: {}", err))?;
        Ok(())
    }

    pub async fn load_latest(&self) -> Result<Option<Value>, String> {
        let row = self
            .client
            .query_opt(
                "select config from config_snapshots order by id desc limit 1",
                &[],
            )
            .await
            .map_err(|err| format!("Could not load config snapshot: {}", err))?;
        Ok(row.map(|row| row.get("config")))
    }
}

/// Serializes the current in-memory store and persists it as a snapshot. The
/// snapshot is skipped when the store has no devices, so a refresh against a
/// broken SHC (which returns empty data) never clobbers the last good state.
pub async fn save_current_snapshot() {
    let Some(repository) = crate::BACKUP_REPOSITORY.get() else {
        return;
    };

    let value = match snapshot_value() {
        Some(value) => value,
        None => return,
    };

    if let Err(err) = repository.save_snapshot(&value).await {
        log::warn!("Could not save config snapshot: {}", err);
    }
}

/// Loads the latest snapshot from Postgres and replaces the in-memory store.
pub async fn restore_latest_snapshot() -> Result<(), String> {
    let Some(repository) = crate::BACKUP_REPOSITORY.get() else {
        return Err("Backup repository is not initialized.".to_string());
    };

    let Some(value) = repository.load_latest().await? else {
        return Err("No config snapshot available to restore.".to_string());
    };

    let data: Data = serde_json::from_value(value)
        .map_err(|err| format!("Could not deserialize config snapshot: {}", err))?;

    if let Some(store) = crate::STORE_DATA.get()
        && let Ok(mut current) = store.data.lock()
    {
        current.clone_from(&data);
        Ok(())
    } else {
        Err("Store is not initialized; cannot restore snapshot.".to_string())
    }
}

fn snapshot_value() -> Option<Value> {
    let store = crate::STORE_DATA.get()?;
    let data = store.data.lock().ok()?;
    if data.devices.is_empty() {
        log::warn!("Skipping config snapshot: no devices in store.");
        return None;
    }
    serde_json::to_value(&*data).ok()
}
