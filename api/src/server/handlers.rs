use axum::extract::{Path, State};
use axum::http::{StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::{DateTime, Days, NaiveDate, Utc};
use serde::Serialize;
use serde_json::{json, Value};
use sunrise::{Coordinates, SolarDay, SolarEvent};
use utoipa::OpenApi;

use crate::api_lib::action::ActionPost;
use crate::api_lib::email::EmailAPI;
use crate::api_lib::livisi_response_type::{ErrorConstruct, LivisResponseType};
use crate::api_lib::location::LocationResponse;
use crate::api_lib::message::MessageRead;
use crate::openapi_doc;
use crate::sentry::SentrySettings;
use crate::server::sorting::{
    sorted_data_value, sorted_devices_map_value, sorted_interactions, sorted_locations,
};
use crate::{AxumState, STORE_DATA};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SunTimesResponse {
    geo_location: String,
    latitude: f64,
    longitude: f64,
    sunrise: Option<String>,
    sunset: Option<String>,
    next_sunrise: Option<String>,
    next_sunset: Option<String>,
    next_event_name: Option<String>,
    next_event_at: Option<String>,
}

pub(crate) async fn get_status(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.status.get_status().await)
}

pub(crate) async fn get_users(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.users.get_users().await)
}

pub(crate) async fn get_devices() -> Response {
    let data = STORE_DATA.get().unwrap().data.lock().unwrap();
    Json(sorted_devices_map_value(&data.devices)).into_response()
}

pub(crate) async fn get_device_states(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.devices.get_all_device_states().await)
}

pub(crate) async fn get_hash(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.hash.get_hash().await)
}

pub(crate) async fn get_openapi_json() -> impl IntoResponse {
    Json(openapi_doc::ApiDoc::openapi())
}

pub(crate) async fn get_products(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.product.get_products().await)
}

pub(crate) async fn get_messages(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.messages.get_messages().await)
}

pub(crate) async fn get_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
) -> impl IntoResponse {
    Json(state.messages.get_message_by_id(message_id).await)
}

pub(crate) async fn delete_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
) -> Response {
    let response = state.messages.delete_message_by_id(message_id).await;
    if response.status().is_success() {
        StatusCode::OK.into_response()
    } else {
        StatusCode::BAD_REQUEST.into_response()
    }
}

pub(crate) async fn update_message_by_id(
    State(state): State<AxumState>,
    Path(message_id): Path<String>,
    Json(message_read): Json<MessageRead>,
) -> Response {
    let response = state
        .messages
        .update_mesage_read(
            message_id,
            MessageRead {
                read: message_read.read,
            },
        )
        .await;
    if response.status().is_success() {
        StatusCode::OK.into_response()
    } else {
        StatusCode::BAD_REQUEST.into_response()
    }
}

pub(crate) async fn get_locations() -> Response {
    let data = STORE_DATA.get().unwrap().data.lock().unwrap();
    Json(sorted_locations(&data.locations, &data.devices)).into_response()
}

pub(crate) async fn get_location_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.locations.get_location_by_id(id).await)
}

pub(crate) async fn create_location(
    State(state): State<AxumState>,
    Json(location_data): Json<LocationResponse>,
) -> impl IntoResponse {
    Json(state.locations.create_location(location_data).await)
}

pub(crate) async fn update_location(
    State(state): State<AxumState>,
    Path(id): Path<String>,
    Json(location_data): Json<LocationResponse>,
) -> impl IntoResponse {
    Json(state.locations.update_location(location_data, id).await)
}

pub(crate) async fn delete_location(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.locations.delete_location(id).await)
}

pub(crate) async fn get_capabilities() -> Response {
    let capabilities = &STORE_DATA.get().unwrap().data.lock().unwrap().capabilities;
    Json(capabilities.clone()).into_response()
}

pub(crate) async fn get_capability_states(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.capabilities.get_all_capability_states().await)
}

pub(crate) async fn get_user_storage() -> Response {
    let user_storage = &STORE_DATA.get().unwrap().data.lock().unwrap().user_storage;
    Json(user_storage.clone()).into_response()
}

pub(crate) async fn get_home_setup(State(state): State<AxumState>) -> impl IntoResponse {
    match state.home.get_home_setup().await {
        Ok(home_setup) => (StatusCode::OK, Json(home_setup)).into_response(),
        Err(error) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({
                "error": error
            })),
        )
            .into_response(),
    }
}

pub(crate) async fn get_sun_times(State(state): State<AxumState>) -> Response {
    let home_setup = match state.home.get_home_setup().await {
        Ok(home_setup) => home_setup,
        Err(error) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "error": error
                })),
            )
                .into_response();
        }
    };
    let geo_location = home_setup.config.geo_location.clone();
    let (latitude, longitude) = match parse_geo_location(&geo_location) {
        Some(coords) => coords,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "Invalid geoLocation in home setup",
                    "geoLocation": geo_location
                })),
            )
                .into_response();
        }
    };

    let now = Utc::now();
    let today = now.date_naive();
    let tomorrow = today.checked_add_days(Days::new(1)).unwrap_or(today);

    let sunrise_today = solar_event_time_for_date(latitude, longitude, today, SolarEvent::Sunrise);
    let sunset_today = solar_event_time_for_date(latitude, longitude, today, SolarEvent::Sunset);
    let sunrise_tomorrow =
        solar_event_time_for_date(latitude, longitude, tomorrow, SolarEvent::Sunrise);
    let sunset_tomorrow =
        solar_event_time_for_date(latitude, longitude, tomorrow, SolarEvent::Sunset);

    let next_sunrise = first_future_event(now, sunrise_today, sunrise_tomorrow);
    let next_sunset = first_future_event(now, sunset_today, sunset_tomorrow);

    let next_event = match (next_sunrise, next_sunset) {
        (Some(sunrise), Some(sunset)) => {
            if sunrise <= sunset {
                Some(("sunrise".to_string(), sunrise))
            } else {
                Some(("sunset".to_string(), sunset))
            }
        }
        (Some(sunrise), None) => Some(("sunrise".to_string(), sunrise)),
        (None, Some(sunset)) => Some(("sunset".to_string(), sunset)),
        (None, None) => None,
    };

    let response = SunTimesResponse {
        geo_location,
        latitude,
        longitude,
        sunrise: sunrise_today.map(|time| time.to_rfc3339()),
        sunset: sunset_today.map(|time| time.to_rfc3339()),
        next_sunrise: next_sunrise.map(|time| time.to_rfc3339()),
        next_sunset: next_sunset.map(|time| time.to_rfc3339()),
        next_event_name: next_event.as_ref().map(|event| event.0.clone()),
        next_event_at: next_event.map(|event| event.1.to_rfc3339()),
    };

    (StatusCode::OK, Json(response)).into_response()
}

pub(crate) async fn post_action(
    State(state): State<AxumState>,
    Json(action_data): Json<ActionPost>,
) -> Response {
    match state.action.post_action(action_data).await {
        LivisResponseType::Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        LivisResponseType::Err(err) => map_livisi_error(err),
    }
}

pub(crate) async fn get_relationship(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.relationship.get_relationship().await)
}

pub(crate) async fn get_interactions(State(state): State<AxumState>) -> impl IntoResponse {
    Json(sorted_interactions(
        &state.interaction.get_interaction().await,
    ))
}

pub(crate) async fn get_interaction_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.interaction.get_interaction_by_id(id).await)
}

pub(crate) async fn update_interaction_by_id(
    State(state): State<AxumState>,
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    match state.interaction.update_interaction_by_id(id, body).await {
        Ok(response) => {
            let refreshed_interactions = state.interaction.get_interaction().await;
            if let Some(store_data) = STORE_DATA.get() {
                if let Ok(mut data) = store_data.data.lock() {
                    data.set_interactions(refreshed_interactions);
                }
            }
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(err) => (StatusCode::BAD_GATEWAY, Json(json!({ "error": err }))).into_response(),
    }
}

pub(crate) async fn trigger_interaction(
    State(state): State<AxumState>,
    Path(id): Path<String>,
) -> Response {
    match state.interaction.trigger_interaction(id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(err) => (StatusCode::BAD_GATEWAY, Json(json!({ "error": err }))).into_response(),
    }
}

pub(crate) async fn get_all_api() -> Response {
    let store = STORE_DATA.get().unwrap();
    let data = store.data.lock().unwrap();
    Json(sorted_data_value(&data)).into_response()
}

pub(crate) async fn unmount_usb_storage(State(state): State<AxumState>) -> Response {
    state.usb_service.unmount_usb_storage().await;
    (StatusCode::OK, "USB storage unmounted.").into_response()
}

pub(crate) async fn get_usb_status(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.usb_service.get_usb_status().await)
}

pub(crate) async fn get_email_settings(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.email.get_email_settings().await)
}

pub(crate) async fn update_email_settings(
    State(state): State<AxumState>,
    Json(email_data): Json<EmailAPI>,
) -> Response {
    let status = state.email.update_email_settings(&email_data).await;
    if let Some(store_data) = STORE_DATA.get() {
        if let Ok(mut store) = store_data.data.lock() {
            store.email = Some(email_data);
        }
    }
    StatusCode::from_u16(status)
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
        .into_response()
}

pub(crate) async fn test_email(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.email.test_email().await)
}

pub(crate) async fn get_sentry_settings(State(state): State<AxumState>) -> impl IntoResponse {
    Json(state.sentry_service.get_settings())
}

pub(crate) async fn update_sentry_settings(
    State(state): State<AxumState>,
    Json(sentry_settings): Json<SentrySettings>,
) -> Response {
    match state
        .sentry_service
        .update_settings(sentry_settings.clone())
        .await
    {
        Ok(updated_settings) => {
            if let Some(store_data) = STORE_DATA.get() {
                if let Ok(mut store) = store_data.data.lock() {
                    store.set_sentry_settings(updated_settings.clone());
                }
            }
            (StatusCode::OK, Json(updated_settings)).into_response()
        }
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": err
            })),
        )
            .into_response(),
    }
}

pub(crate) async fn test_sentry_notification(State(state): State<AxumState>) -> Response {
    match state.sentry_service.test_notification().await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "result": "sent"
            })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": err
            })),
        )
            .into_response(),
    }
}

pub(crate) async fn get_capabilities_temperature(
    State(state): State<AxumState>,
    uri: Uri,
) -> Response {
    if uri.path() != "/data/capability" {
        return (StatusCode::BAD_REQUEST, "Invalid URL").into_response();
    }

    let full_url = uri
        .path_and_query()
        .map(|path_and_query| path_and_query.as_str().to_string())
        .unwrap_or_else(|| uri.path().to_string());

    let response = state.capabilities.get_historic_data(&full_url).await;
    Json(response).into_response()
}

fn parse_geo_location(geo_location: &str) -> Option<(f64, f64)> {
    let mut tokens: Vec<String> = Vec::new();
    let mut current = String::new();

    for char in geo_location.chars() {
        if char.is_ascii_digit() || char == '.' || char == '-' || char == '+' {
            current.push(char);
        } else if !current.is_empty() {
            tokens.push(current.clone());
            current.clear();
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    if tokens.len() < 2 {
        return None;
    }

    let mut first = tokens[0].parse::<f64>().ok()?;
    let mut second = tokens[1].parse::<f64>().ok()?;

    if !(-90.0..=90.0).contains(&first)
        && (-90.0..=90.0).contains(&second)
        && (-180.0..=180.0).contains(&first)
    {
        std::mem::swap(&mut first, &mut second);
    }

    if !(-90.0..=90.0).contains(&first) || !(-180.0..=180.0).contains(&second) {
        return None;
    }

    Some((first, second))
}

fn solar_event_time_for_date(
    latitude: f64,
    longitude: f64,
    date: NaiveDate,
    event: SolarEvent,
) -> Option<DateTime<Utc>> {
    let coordinates = Coordinates::new(latitude, longitude)?;
    SolarDay::new(coordinates, date).event_time(event)
}

fn first_future_event(
    now: DateTime<Utc>,
    first: Option<DateTime<Utc>>,
    second: Option<DateTime<Utc>>,
) -> Option<DateTime<Utc>> {
    if let Some(time) = first {
        if time > now {
            return Some(time);
        }
    }
    second.filter(|time| *time > now)
}

fn map_livisi_error(err: ErrorConstruct) -> Response {
    let status = match err.errorcode {
        1000 => StatusCode::INTERNAL_SERVER_ERROR,
        1001 => StatusCode::EXPECTATION_FAILED,
        1002 => StatusCode::REQUEST_TIMEOUT,
        1003 => StatusCode::INTERNAL_SERVER_ERROR,
        1004 => StatusCode::BAD_REQUEST,
        1005 => StatusCode::BAD_REQUEST,
        1006 => StatusCode::SERVICE_UNAVAILABLE,
        1007 => StatusCode::BAD_REQUEST,
        1008 => StatusCode::PRECONDITION_FAILED,
        2000 => StatusCode::BAD_REQUEST,
        2001 => StatusCode::FORBIDDEN,
        2002 => StatusCode::FORBIDDEN,
        2003 => StatusCode::UNAUTHORIZED,
        2004 => StatusCode::FORBIDDEN,
        2005 => StatusCode::FORBIDDEN,
        2006 => StatusCode::CONFLICT,
        2007 => StatusCode::UNAUTHORIZED,
        2008 => StatusCode::FORBIDDEN,
        2009 => StatusCode::UNAUTHORIZED,
        2010 => StatusCode::FORBIDDEN,
        2011 => StatusCode::FORBIDDEN,
        2012 => StatusCode::FAILED_DEPENDENCY,
        2013 => StatusCode::FORBIDDEN,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };

    (status, Json(err)).into_response()
}
