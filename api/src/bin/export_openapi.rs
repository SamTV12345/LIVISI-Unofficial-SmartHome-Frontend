#[path = "../openapi_doc.rs"]
mod openapi_doc;

use utoipa::OpenApi;

fn main() {
    let openapi = openapi_doc::ApiDoc::openapi();
    let json = serde_json::to_string_pretty(&openapi).expect("Could not serialize OpenAPI document");
    println!("{}", json);
}
