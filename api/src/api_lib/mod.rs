use serde::de::DeserializeOwned;

pub mod action;
pub mod capability;
pub mod device;
pub mod email;
pub mod hash;
pub mod home;
pub mod interaction;
pub(crate) mod livisi_response_type;
pub mod location;
pub mod message;
pub mod product;
pub mod relationship;
pub mod status;
pub mod unmount_service;
pub mod user;
pub mod user_storage;

/// Unified error for upstream LIVISI requests. reqwest 0.13 no longer exposes a
/// public constructor for decode errors, so we carry the serde error ourselves
/// instead of forcing every caller to depend on reqwest's error internals.
#[derive(Debug)]
pub(crate) enum ApiError {
    Transport(reqwest::Error),
    Decode(serde_json::Error),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::Transport(e) => write!(f, "{e}"),
            ApiError::Decode(e) => write!(f, "{e}"),
        }
    }
}

impl std::error::Error for ApiError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            ApiError::Transport(e) => Some(e),
            ApiError::Decode(e) => Some(e),
        }
    }
}

impl From<reqwest::Error> for ApiError {
    fn from(e: reqwest::Error) -> Self {
        ApiError::Transport(e)
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(e: serde_json::Error) -> Self {
        ApiError::Decode(e)
    }
}

/// Parses a LIVISI SHC response as JSON, normalizing the SHC 1 ("Classic")
/// quirk of returning `[]` instead of `null` for missing objects — the same
/// workaround the openHAB livisismarthome binding applies in
/// `LivisiClient.normalizeResponseContent`.
pub(crate) async fn parse_json<T: DeserializeOwned>(
    response: reqwest::Response,
) -> Result<T, ApiError> {
    let text = response.text().await?;
    let normalized = text.replace("[]", "null");
    serde_json::from_str::<T>(&normalized).map_err(ApiError::from)
}
