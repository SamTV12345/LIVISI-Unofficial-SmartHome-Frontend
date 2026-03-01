use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use serde_json::json;
use std::future::pending;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::STORE_DATA;

static IS_SHUTTING_DOWN: AtomicBool = AtomicBool::new(false);

pub(crate) async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(err) = tokio::signal::ctrl_c().await {
            log::error!("Could not install Ctrl+C handler: {}", err);
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(err) => {
                log::error!("Could not install SIGTERM handler: {}", err);
                pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    IS_SHUTTING_DOWN.store(true, Ordering::Relaxed);
    log::info!("Shutdown signal received. Draining in-flight HTTP requests.");
}

pub(crate) async fn liveness_probe() -> Response {
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "probe": "liveness",
            "timestamp": Utc::now().to_rfc3339()
        })),
    )
        .into_response()
}

pub(crate) async fn readiness_probe() -> Response {
    if IS_SHUTTING_DOWN.load(Ordering::Relaxed) {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "not_ready",
                "probe": "readiness",
                "reason": "shutting_down",
                "timestamp": Utc::now().to_rfc3339()
            })),
        )
            .into_response();
    }

    let Some(store) = STORE_DATA.get() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "not_ready",
                "probe": "readiness",
                "reason": "store_not_initialized",
                "timestamp": Utc::now().to_rfc3339()
            })),
        )
            .into_response();
    };

    let data = match store.data.lock() {
        Ok(data) => data,
        Err(err) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "not_ready",
                    "probe": "readiness",
                    "reason": "store_lock_failed",
                    "error": err.to_string(),
                    "timestamp": Utc::now().to_rfc3339()
                })),
            )
                .into_response();
        }
    };

    let has_core_state = data.status.is_some()
        || !data.devices.is_empty()
        || !data.locations.is_empty()
        || data.user_storage.is_some()
        || data.email.is_some();

    let payload = json!({
        "status": if has_core_state { "ready" } else { "not_ready" },
        "probe": "readiness",
        "timestamp": Utc::now().to_rfc3339(),
        "checks": {
            "statusLoaded": data.status.is_some(),
            "devicesLoaded": !data.devices.is_empty(),
            "locationsLoaded": !data.locations.is_empty(),
            "userStorageLoaded": data.user_storage.is_some(),
            "emailLoaded": data.email.is_some()
        },
        "counts": {
            "devices": data.devices.len(),
            "locations": data.locations.len(),
            "interactions": data.interactions.len(),
            "messages": data.messages.len()
        }
    });

    if has_core_state {
        (StatusCode::OK, Json(payload)).into_response()
    } else {
        (StatusCode::SERVICE_UNAVAILABLE, Json(payload)).into_response()
    }
}
