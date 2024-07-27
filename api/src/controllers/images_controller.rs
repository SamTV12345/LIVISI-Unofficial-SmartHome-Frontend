use std::env::var;
use actix_web::{get, HttpResponse, HttpResponseBuilder, Responder, web};
use actix_web::web::Data;
use kv::Bucket;
use reqwest::Client;
use crate::api_lib::home::Home;
use path_clean::{clean, PathClean};

#[get("/images/{tail:.*}")]
pub async fn get_images(home: web::Path<String>, bucket: web::Data<Bucket<'_, String, String>>) ->
                                                                                             impl
Responder {
    let base_url = var("BASE_URL").unwrap().replace(":8080","");

    let requested_path = clean(home.into_inner());

    if !requested_path.starts_with("svg_single") {
        return HttpResponse::BadRequest().body("Invalid path");
    }
    let str_rep_path = requested_path.to_str().unwrap().to_string();
    let mut shc_path = base_url + "/images/" + &str_rep_path;
    shc_path = shc_path.replace("\\", "/");
    return match bucket.get(&str_rep_path) {
        Ok(value) => {
            match value {
                Some(data) => {
                    handle_http_builder(&str_rep_path)
                        .body(data)
                }
                None => {
                    let data = reqwest::get(shc_path)
                        .await
                        .unwrap()
                        .text()
                        .await
                        .unwrap();
                    bucket.set(&str_rep_path, &data).unwrap();
                    handle_http_builder(&str_rep_path)
                        .body(data)
                }
            }
        }
        Err(_) => {
            let data = reqwest::get(shc_path)
                .await
                .unwrap()
                .text()
                .await
                .unwrap();
            bucket.set(&str_rep_path, &data).unwrap();
            handle_http_builder(&str_rep_path)
                .body(data)
        }
    }
}


fn handle_http_builder(url: &str) -> HttpResponseBuilder {
    let mut builder = HttpResponse::Ok();
    match url.strip_suffix(".svg") {
        Some(_) => {
            builder.append_header(("Content-Type", "image/svg+xml"));
        }
        None => {
            builder.append_header(("Content-Type", "image/png"));
        }
    }
    return builder;
}