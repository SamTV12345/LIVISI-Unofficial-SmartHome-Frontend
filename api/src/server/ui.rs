use axum::extract::{Path, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Redirect, Response};
use include_dir::{include_dir, Dir};
use path_clean::clean;

use crate::AxumState;

static EMBEDDED_UI_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/static");

pub(crate) async fn root_redirect() -> impl IntoResponse {
    Redirect::temporary("/ui/")
}

pub(crate) async fn ui_redirect() -> impl IntoResponse {
    Redirect::temporary("/ui/")
}

pub(crate) async fn index() -> Response {
    serve_ui_asset("index.html".to_string(), true).await
}

pub(crate) async fn get_ui_file(Path(path): Path<String>) -> Response {
    serve_ui_asset(path, true).await
}

async fn serve_ui_asset(path: String, fallback_to_index: bool) -> Response {
    let requested_path = clean("/".to_owned() + path.trim_start_matches('/'));
    let requested_str = requested_path.to_string_lossy().replace('\\', "/");

    if !requested_str.starts_with('/') {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }

    let relative_path = requested_str.trim_start_matches('/');
    let has_file_extension = relative_path.contains('.');

    if has_file_extension {
        return serve_embedded_ui_file(relative_path)
            .unwrap_or_else(|| (StatusCode::NOT_FOUND, "Not found").into_response());
    }

    if fallback_to_index {
        return serve_embedded_ui_file("index.html").unwrap_or_else(|| {
            log::warn!(
                "No embedded UI build found. index.html missing in api/static at compile time."
            );
            (
                StatusCode::SERVICE_UNAVAILABLE,
                "Embedded UI missing. Build ui-new and rebuild the Rust binary.",
            )
                .into_response()
        });
    }

    (StatusCode::NOT_FOUND, "Not found").into_response()
}

fn serve_embedded_ui_file(path: &str) -> Option<Response> {
    EMBEDDED_UI_DIR.get_file(path).map(|file| {
        (
            [(header::CONTENT_TYPE, content_type_from_path(path))],
            file.contents().to_vec(),
        )
            .into_response()
    })
}

pub(crate) async fn get_images(
    State(state): State<AxumState>,
    Path(tail): Path<String>,
) -> Response {
    get_cached_remote_asset(state, "images", tail).await
}

pub(crate) async fn get_resources(
    State(state): State<AxumState>,
    Path(tail): Path<String>,
) -> Response {
    get_cached_remote_asset(state, "resources", tail).await
}

async fn get_cached_remote_asset(state: AxumState, prefix: &str, tail: String) -> Response {
    let requested_path = clean(format!("/{}/{}", prefix, tail));
    let requested_str = requested_path.to_string_lossy().replace('\\', "/");

    if !requested_str.starts_with(&format!("/{}", prefix)) {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }

    let bucket = match state.kv_store.bucket::<String, String>(Some("images")) {
        Ok(bucket) => bucket,
        Err(err) => {
            log::error!("Could not open KV bucket: {}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, "KV store error").into_response();
        }
    };

    if let Ok(Some(cached_data)) = bucket.get(&requested_str) {
        return (
            [(header::CONTENT_TYPE, content_type_from_path(&requested_str))],
            cached_data,
        )
            .into_response();
    }

    let shc_path = format!(
        "{}{}",
        state.resource_base_url,
        requested_str.replace('\\', "/")
    );
    let data = match reqwest::get(shc_path).await {
        Ok(response) => match response.text().await {
            Ok(body) => body,
            Err(err) => {
                log::error!("Could not read remote asset body: {}", err);
                return (StatusCode::BAD_GATEWAY, "Could not read remote asset").into_response();
            }
        },
        Err(err) => {
            log::error!("Could not fetch remote asset: {}", err);
            return (StatusCode::BAD_GATEWAY, "Could not fetch remote asset").into_response();
        }
    };

    if let Err(err) = bucket.set(&requested_str, &data) {
        log::warn!("Could not cache remote asset {}: {}", requested_str, err);
    }

    (
        [(header::CONTENT_TYPE, content_type_from_path(&requested_str))],
        data,
    )
        .into_response()
}

fn content_type_from_path(path: &str) -> &'static str {
    if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".js") || path.ends_with(".mjs") {
        "application/javascript; charset=utf-8"
    } else if path.ends_with(".map") {
        "application/json; charset=utf-8"
    } else if path.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if path.ends_with(".json") {
        "application/json; charset=utf-8"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".gif") {
        "image/gif"
    } else if path.ends_with(".webp") {
        "image/webp"
    } else if path.ends_with(".woff") {
        "font/woff"
    } else if path.ends_with(".woff2") {
        "font/woff2"
    } else if path.ends_with(".ttf") {
        "font/ttf"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else {
        "application/octet-stream"
    }
}
