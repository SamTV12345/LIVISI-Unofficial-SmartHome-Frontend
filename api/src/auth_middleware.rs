
use std::env::var;
use std::pin::Pin;
use std::rc::Rc;


use actix::fut::{ok};
use futures_util::{FutureExt};
use actix_web::{dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform}, Error};
use actix_web::body::{EitherBody, MessageBody};
use actix_web::error::{ErrorUnauthorized};

use base64::Engine;
use base64::engine::general_purpose;
use futures_util::future::{LocalBoxFuture, Ready};

use crate::constants::constants::{BASIC_AUTH, PASSWORD_BASIC, USERNAME_BASIC};





#[derive(Default)]
pub struct AuthFilter {
}

impl AuthFilter {
    pub fn new() -> Self {
        AuthFilter {
        }
    }
}

pub struct AuthFilterMiddleware<S>{
    service: Rc<S>
}



impl<S, B> Transform<S, ServiceRequest> for AuthFilter
    where
        S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
        S::Future: 'static,
        B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthFilterMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthFilterMiddleware {
            service: Rc::new(service)
        })
    }
}



impl<S, B> Service<ServiceRequest> for AuthFilterMiddleware<S>
    where
        S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
        S::Future: 'static,
        B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        if var(BASIC_AUTH).is_ok() {
            self.handle_basic_auth(req)
        } else {
            // It can only be no auth
            self.handle_no_auth(req)
        }
    }
    }
impl<S, B> AuthFilterMiddleware<S> where B: 'static + MessageBody, S: 'static + Service<ServiceRequest, Response=ServiceResponse<B>, Error=Error>, S::Future: 'static {
    fn handle_basic_auth(&self, req: ServiceRequest) -> Pin<Box<dyn futures_util::Future<Output=Result<ServiceResponse<EitherBody<B>>, Error>>>>  {
        let opt_auth_header = req.headers().get("Authorization");
        if opt_auth_header.is_none() {
            return Box::pin(ok(req.error_response(ErrorUnauthorized("Unauthorized")).map_into_right_body()));
        }
        let authorization = opt_auth_header.unwrap().to_str();
        return match authorization {
            Ok(auth) => {
                let (username, password) = AuthFilter::extract_basic_auth(auth);

                if username.clone() == var(USERNAME_BASIC).unwrap(){
                    return match password == var(PASSWORD_BASIC).unwrap() {
                        true => {
                            let service = Rc::clone(&self.service);
                            async move {
                                service
                                    .call(req)
                                    .await
                                    .map(|res| res.map_into_left_body())
                            }
                                .boxed_local()
                        },
                        false => {
                            Box::pin(ok(req.error_response(ErrorUnauthorized("Unauthorized"))
                                .map_into_right_body()))
                        }
                    }
                }


                Box::pin(ok(req.error_response(ErrorUnauthorized("Unauthorized")).map_into_right_body()))
            },
            Err(_) => {
                Box::pin(ok(req.error_response(ErrorUnauthorized("Unauthorized")).map_into_right_body()))
            }
        }
    }

    fn handle_no_auth(&self, req: ServiceRequest) -> Pin<Box<dyn
    futures_util::Future<Output=Result<ServiceResponse<EitherBody<B>>, Error>>>>{
        let service = Rc::clone(&self.service);
        async move {
            service
                .call(req)
                .await
                .map(|res| res.map_into_left_body())
        }
            .boxed_local()
    }
}

impl AuthFilter{
    pub fn extract_basic_auth(auth: &str) -> (String, String) {
        let auth = auth.to_string();
        let auth = auth.split(' ').collect::<Vec<&str>>();
        let auth = auth[1];
        let auth = general_purpose::STANDARD.decode(auth).unwrap();
        let auth = String::from_utf8(auth).unwrap();
        let auth = auth.split(':').collect::<Vec<&str>>();
        let username = auth[0];
        let password = auth[1];
        (username.to_string(), password.to_string())
    }
}