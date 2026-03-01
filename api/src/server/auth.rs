use axum::extract::{Request, State};
use axum::http::{header, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;
use base64::engine::general_purpose;
use base64::Engine;
use jsonwebtoken::jwk::JwkSet;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env::var;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::constants::constant_types::{
    AUTH_MODE, BASIC_AUTH, OIDC_AUDIENCE, OIDC_AUTH, OIDC_AUTHORITY, OIDC_CLIENT_ID,
    OIDC_REDIRECT_URI, OIDC_SCOPE, PASSWORD_BASIC, USERNAME_BASIC,
};
use crate::AxumState;

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum AuthMode {
    None,
    Basic,
    Oidc,
}

impl AuthMode {
    fn as_str(&self) -> &'static str {
        match self {
            AuthMode::None => "none",
            AuthMode::Basic => "basic",
            AuthMode::Oidc => "oidc",
        }
    }
}

impl FromStr for AuthMode {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_ascii_lowercase().as_str() {
            "none" => Ok(AuthMode::None),
            "basic" => Ok(AuthMode::Basic),
            "oidc" => Ok(AuthMode::Oidc),
            other => Err(format!(
                "Unsupported AUTH_MODE '{}'. Use one of: none, basic, oidc.",
                other
            )),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ConfigModel {
    auth_mode: AuthMode,
    basic_auth: bool,
    oidc_configured: bool,
    oidc_config: Option<OidcConfigModel>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OidcConfigModel {
    authority: String,
    client_id: String,
    redirect_uri: String,
    scope: String,
}

#[derive(Clone)]
pub(crate) struct BasicAuthRuntime {
    username: String,
    password: String,
}

#[derive(Clone)]
struct OidcJwksCache {
    jwks: JwkSet,
    fetched_at: Instant,
}

#[derive(Clone)]
pub(crate) struct OidcAuthRuntime {
    config: OidcConfigModel,
    issuer: String,
    audience: Option<String>,
    jwks_uri: String,
    client: reqwest::Client,
    jwks_cache: Arc<Mutex<Option<OidcJwksCache>>>,
}

#[derive(Clone)]
pub(crate) enum AuthRuntime {
    None,
    Basic(BasicAuthRuntime),
    Oidc(OidcAuthRuntime),
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
struct OidcDiscoveryDocument {
    issuer: String,
    jwks_uri: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct LoginRequest {
    username: String,
    password: String,
}

impl AuthRuntime {
    fn mode(&self) -> AuthMode {
        match self {
            AuthRuntime::None => AuthMode::None,
            AuthRuntime::Basic(_) => AuthMode::Basic,
            AuthRuntime::Oidc(_) => AuthMode::Oidc,
        }
    }

    fn oidc_config(&self) -> Option<OidcConfigModel> {
        match self {
            AuthRuntime::Oidc(runtime) => Some(runtime.config.clone()),
            _ => None,
        }
    }

    fn to_config_model(&self) -> ConfigModel {
        let auth_mode = self.mode();
        ConfigModel {
            auth_mode,
            basic_auth: auth_mode == AuthMode::Basic,
            oidc_configured: auth_mode == AuthMode::Oidc,
            oidc_config: self.oidc_config(),
        }
    }
}

impl OidcAuthRuntime {
    const JWKS_CACHE_TTL: Duration = Duration::from_secs(600);

    async fn validate_token(&self, token: &str) -> Result<(), String> {
        let token_header = decode_header(token)
            .map_err(|error| format!("Could not decode JWT header: {}", error))?;

        let validation = self.build_validation(token_header.alg);
        self.validate_with_cached_keys(token, &token_header.kid, &validation)
            .await
    }

    fn build_validation(&self, algorithm: Algorithm) -> Validation {
        let mut validation = Validation::new(algorithm);
        validation.set_issuer(&[self.issuer.as_str()]);
        if let Some(audience) = &self.audience {
            validation.set_audience(&[audience.as_str()]);
        } else {
            validation.validate_aud = false;
        }
        validation.leeway = 15;
        validation
    }

    async fn validate_with_cached_keys(
        &self,
        token: &str,
        key_id: &Option<String>,
        validation: &Validation,
    ) -> Result<(), String> {
        let cached_jwks = self.get_jwks().await?;
        if self
            .try_validate_token_with_jwks(token, key_id, validation, &cached_jwks)
            .is_ok()
        {
            return Ok(());
        }

        let fresh_jwks = self.fetch_jwks().await?;
        self.try_validate_token_with_jwks(token, key_id, validation, &fresh_jwks)
    }

    fn try_validate_token_with_jwks(
        &self,
        token: &str,
        key_id: &Option<String>,
        validation: &Validation,
        jwks: &JwkSet,
    ) -> Result<(), String> {
        let matching_keys: Vec<_> = jwks
            .keys
            .iter()
            .filter(|jwk| {
                if let Some(key_id) = key_id {
                    return jwk.common.key_id.as_deref() == Some(key_id.as_str());
                }
                true
            })
            .collect();

        if matching_keys.is_empty() {
            return Err("No matching OIDC key found for token".to_string());
        }

        let mut last_error = String::new();
        for jwk in matching_keys {
            let decoding_key = match DecodingKey::from_jwk(jwk) {
                Ok(key) => key,
                Err(error) => {
                    last_error = format!("Could not convert JWK: {}", error);
                    continue;
                }
            };

            match decode::<Value>(token, &decoding_key, validation) {
                Ok(token_data) => {
                    if self.audience.is_none() {
                        let authorized_party = token_data.claims.get("azp").and_then(Value::as_str);
                        if authorized_party != Some(self.config.client_id.as_str()) {
                            last_error =
                                "OIDC token validation failed: azp does not match OIDC_CLIENT_ID".to_string();
                            continue;
                        }
                    }

                    return Ok(());
                }
                Err(error) => {
                    last_error = error.to_string();
                }
            }
        }

        if last_error.is_empty() {
            last_error = "Unknown token validation error".to_string();
        }
        Err(format!("OIDC token validation failed: {}", last_error))
    }

    async fn get_jwks(&self) -> Result<JwkSet, String> {
        {
            let cache = self
                .jwks_cache
                .lock()
                .map_err(|_| "OIDC JWKS cache lock poisoned".to_string())?;
            if let Some(cache) = cache.as_ref() {
                if cache.fetched_at.elapsed() < Self::JWKS_CACHE_TTL {
                    return Ok(cache.jwks.clone());
                }
            }
        }

        self.fetch_jwks().await
    }

    async fn fetch_jwks(&self) -> Result<JwkSet, String> {
        let response = self
            .client
            .get(&self.jwks_uri)
            .send()
            .await
            .map_err(|error| format!("Could not fetch OIDC JWKS: {}", error))?;

        if !response.status().is_success() {
            return Err(format!(
                "OIDC JWKS request failed with status {}",
                response.status()
            ));
        }

        let jwks = response
            .json::<JwkSet>()
            .await
            .map_err(|error| format!("Could not parse OIDC JWKS response: {}", error))?;

        let mut cache = self
            .jwks_cache
            .lock()
            .map_err(|_| "OIDC JWKS cache lock poisoned".to_string())?;
        *cache = Some(OidcJwksCache {
            jwks: jwks.clone(),
            fetched_at: Instant::now(),
        });

        Ok(jwks)
    }
}

fn env_flag_enabled(name: &str) -> bool {
    let Ok(raw_value) = var(name) else {
        return false;
    };

    match raw_value.trim().to_ascii_lowercase().as_str() {
        "0" | "false" | "no" | "off" => false,
        _ => true,
    }
}

fn resolve_auth_mode() -> AuthMode {
    if let Ok(auth_mode_raw) = var(AUTH_MODE) {
        return AuthMode::from_str(&auth_mode_raw).unwrap_or_else(|error| panic!("{}", error));
    }

    if env_flag_enabled(OIDC_AUTH) {
        return AuthMode::Oidc;
    }

    if env_flag_enabled(BASIC_AUTH) {
        return AuthMode::Basic;
    }

    AuthMode::None
}

async fn load_oidc_discovery(authority: &str) -> OidcDiscoveryDocument {
    let well_known_url = format!(
        "{}/.well-known/openid-configuration",
        authority.trim_end_matches('/')
    );

    let response = reqwest::get(&well_known_url)
        .await
        .unwrap_or_else(|error| panic!("Could not fetch OIDC discovery document: {}", error));

    if !response.status().is_success() {
        panic!(
            "OIDC discovery endpoint {} returned status {}",
            well_known_url,
            response.status()
        );
    }

    response
        .json::<OidcDiscoveryDocument>()
        .await
        .unwrap_or_else(|error| panic!("Could not parse OIDC discovery document: {}", error))
}

pub(crate) async fn build_auth_runtime() -> AuthRuntime {
    let auth_mode = resolve_auth_mode();
    log::info!("Authentication mode selected: {}", auth_mode.as_str());

    match auth_mode {
        AuthMode::None => AuthRuntime::None,
        AuthMode::Basic => {
            let username = var(USERNAME_BASIC)
                .expect("BASIC_USERNAME is required when AUTH_MODE is set to 'basic'");
            let password = var(PASSWORD_BASIC)
                .expect("BASIC_PASSWORD is required when AUTH_MODE is set to 'basic'");
            AuthRuntime::Basic(BasicAuthRuntime { username, password })
        }
        AuthMode::Oidc => {
            let scope = var(OIDC_SCOPE).unwrap_or("openid profile email".to_string());
            let oidc_config = OidcConfigModel {
                redirect_uri: var(OIDC_REDIRECT_URI)
                    .expect("OIDC_REDIRECT_URI is required when AUTH_MODE is set to 'oidc'"),
                authority: var(OIDC_AUTHORITY)
                    .expect("OIDC_AUTHORITY is required when AUTH_MODE is set to 'oidc'"),
                client_id: var(OIDC_CLIENT_ID)
                    .expect("OIDC_CLIENT_ID is required when AUTH_MODE is set to 'oidc'"),
                scope,
            };

            let discovery = load_oidc_discovery(&oidc_config.authority).await;
            let audience = var(OIDC_AUDIENCE)
                .ok()
                .filter(|value| !value.trim().is_empty());

            AuthRuntime::Oidc(OidcAuthRuntime {
                config: oidc_config,
                issuer: discovery.issuer,
                audience,
                jwks_uri: discovery.jwks_uri,
                client: reqwest::Client::new(),
                jwks_cache: Arc::new(Mutex::new(None)),
            })
        }
    }
}

fn read_authorization_from_query(request: &Request) -> Option<String> {
    let query = request.uri().query()?;
    for entry in query.split('&') {
        let mut parts = entry.splitn(2, '=');
        let Some(key) = parts.next() else {
            continue;
        };
        if key != "authorization" {
            continue;
        }

        let value = parts.next().unwrap_or_default().replace('+', " ");
        if let Ok(decoded) = urlencoding::decode(&value) {
            return Some(decoded.into_owned());
        }
        return Some(value);
    }

    None
}

fn read_authorization(request: &Request) -> Option<String> {
    if let Some(header_value) = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
    {
        return Some(header_value.to_string());
    }

    read_authorization_from_query(request)
}

fn basic_unauthorized_response() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        [(header::WWW_AUTHENTICATE, "Basic realm=\"LIVISI\"")],
        "Unauthorized",
    )
        .into_response()
}

fn bearer_unauthorized_response() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        [(header::WWW_AUTHENTICATE, "Bearer realm=\"LIVISI\"")],
        "Unauthorized",
    )
        .into_response()
}

fn validate_basic_credentials(authorization: &str, runtime: &BasicAuthRuntime) -> bool {
    let Some(encoded_part) = authorization.strip_prefix("Basic ") else {
        return false;
    };

    let decoded = match general_purpose::STANDARD.decode(encoded_part) {
        Ok(data) => data,
        Err(_) => return false,
    };

    let decoded = match String::from_utf8(decoded) {
        Ok(data) => data,
        Err(_) => return false,
    };

    let mut parts = decoded.splitn(2, ':');
    let username = parts.next().unwrap_or_default();
    let password = parts.next().unwrap_or_default();

    username == runtime.username && password == runtime.password
}

pub(crate) async fn auth_middleware(
    State(auth_runtime): State<AuthRuntime>,
    request: Request,
    next: Next,
) -> Response {
    match auth_runtime {
        AuthRuntime::None => next.run(request).await,
        AuthRuntime::Basic(runtime) => {
            let Some(authorization) = read_authorization(&request) else {
                return basic_unauthorized_response();
            };

            if validate_basic_credentials(&authorization, &runtime) {
                next.run(request).await
            } else {
                basic_unauthorized_response()
            }
        }
        AuthRuntime::Oidc(runtime) => {
            let Some(authorization) = read_authorization(&request) else {
                return bearer_unauthorized_response();
            };

            let Some(token) = authorization.strip_prefix("Bearer ") else {
                return bearer_unauthorized_response();
            };

            if let Err(error) = runtime.validate_token(token).await {
                log::warn!("OIDC token validation failed: {}", error);
                return bearer_unauthorized_response();
            }

            next.run(request).await
        }
    }
}

pub(crate) async fn get_api_config(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.auth_runtime.to_config_model())
}

pub(crate) async fn login(
    State(state): State<AxumState>,
    Json(auth): Json<LoginRequest>,
) -> Response {
    let AuthRuntime::Basic(runtime) = &state.auth_runtime else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!("Login endpoint is only available in basic auth mode")),
        )
            .into_response();
    };

    if auth.username == runtime.username && auth.password == runtime.password {
        return (StatusCode::OK, Json(json!("Login successful"))).into_response();
    }

    (
        StatusCode::UNAUTHORIZED,
        Json(json!("Username or password incorrect")),
    )
        .into_response()
}
