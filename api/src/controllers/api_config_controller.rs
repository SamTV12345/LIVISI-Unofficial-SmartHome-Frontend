use std::env::var;
use actix_web::{HttpResponse, Responder, web};
use crate::constants::constants::{BASIC_AUTH, OIDC_AUTH, OIDC_AUTHORITY, OIDC_CLIENT_ID, OIDC_REDIRECT_URI, OIDC_SCOPE, PASSWORD_BASIC, USERNAME_BASIC};
use serde::{Serialize, Deserialize};
use actix_web::get;
use actix_web::post;
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigModel {
    pub basic_auth: bool,
    pub oidc_configured: bool,
    pub oidc_config: Option<OidcConfig>
}


#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OidcConfig{
    authority: String,
    client_id: String,
    redirect_uri: String,
    scope: String
}

#[get("/api/server")]
pub async fn get_api_config() ->impl Responder{
    let basic_auth = var(BASIC_AUTH).is_ok();
    let oidc_configured = var(OIDC_AUTH).is_ok();

    let mut config = ConfigModel {
        basic_auth,
        oidc_configured,
        oidc_config: None,
    };
    if oidc_configured{
        config.oidc_config = Some(OidcConfig{
            redirect_uri: var(OIDC_REDIRECT_URI).expect("OIDC redirect uri not \
            configured"),
            authority: var(OIDC_AUTHORITY).expect("OIDC authority not configured"),
            client_id: var(OIDC_CLIENT_ID).expect("OIDC client id not configured"),
            scope: var(OIDC_SCOPE).unwrap_or("openid profile email".to_string())
        });
    }
    HttpResponse::Ok().json(config)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[post("/login")]
pub async fn login(auth: web::Json<LoginRequest>) -> impl Responder {
    if var(BASIC_AUTH).is_err() {
        return HttpResponse::Unauthorized()
            .json("Username or password incorrect");
    }

    if auth.0.username == var(USERNAME_BASIC).unwrap() && auth.0.password == var(PASSWORD_BASIC).unwrap() {
        return HttpResponse::Ok().json("Login successful");
    }
    HttpResponse::Unauthorized()
        .json("Username or password incorrect")
}