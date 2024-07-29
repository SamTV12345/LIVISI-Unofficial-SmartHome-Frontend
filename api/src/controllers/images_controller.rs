use std::env::var;
use actix_web::{get, HttpResponse, HttpResponseBuilder, Responder, web};
use kv::Bucket;
use path_clean::clean;

#[get("/images/{tail:.*}")]
pub async fn get_images(home: web::Path<String>, bucket: web::Data<Bucket<'_, String, String>>) ->
                                                                                             impl
Responder {
    let base_url = var("BASE_URL").unwrap().replace(":8080","");

    let requested_path = clean("/images/".to_owned() + &*home.into_inner());

    if !requested_path.starts_with("/images") {
        return HttpResponse::BadRequest().body("Invalid path");
    }
    let str_rep_path = requested_path.to_str().unwrap().to_string();
    let mut shc_path = base_url  + &str_rep_path;
    shc_path = shc_path.replace("\\", "/");
    match bucket.get(&str_rep_path) {
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

#[get("/resources/{tail:.*}")]
pub async fn get_resources(home: web::Path<String>, bucket: web::Data<Bucket<'_, String,
    String>>) ->
                                        impl
                                        Responder {
    let base_url = var("BASE_URL").unwrap().replace(":8080","");

    let requested_path = clean("/resources/".to_owned() + &*home.into_inner());

    if !requested_path.starts_with("/resources") {
        return HttpResponse::BadRequest().body("Invalid path");
    }
    let str_rep_path = requested_path.to_str().unwrap().to_string();
    let mut shc_path = base_url  + &str_rep_path;
    shc_path = shc_path.replace("\\", "/");
    match bucket.get(&str_rep_path) {
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
    match url.contains(".svg") {
        true=> {
            builder.append_header(("Content-Type", "image/svg+xml"));
        }
        false => {
            match url.contains(".html") {
                true => {
                    builder.append_header(("Content-Type", "text/html"));
                }
                false => {
                    match url.contains("js") {
                        true => {
                            builder.append_header(("Content-Type", "application/javascript"));
                        }
                        false => {
                            match url.contains("css") {
                                true => {
                                    builder.append_header(("Content-Type", "text/css"));
                                }
                                false => {
                                    builder.append_header(("Content-Type", "image/png"));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    builder
}