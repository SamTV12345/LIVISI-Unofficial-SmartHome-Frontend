
use std::pin::Pin;
use std::rc::Rc;

use std::time::{SystemTime, UNIX_EPOCH};
use actix::fut::{ok};
use futures_util::{FutureExt};
use actix_web::{dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform}, Error, web};
use actix_web::body::{EitherBody, MessageBody};


use futures_util::future::{LocalBoxFuture, Ready};
use redis::{Commands, Connection};

use crate::models::token::{CreatedAt, Token, TokenRequest};
use crate::AppState;
use crate::utils::connection::RedisConnection;
use crate::utils::header_utils::HeaderUtils;

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

impl Default for AuthFilter {
    fn default() -> Self {
        Self {
        }
    }
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

            // It can only be no auth
            return self.handle_no_auth(req);
    }
}

impl<S, B> AuthFilterMiddleware<S> where B: 'static + MessageBody, S: 'static + Service<ServiceRequest, Response=ServiceResponse<B>, Error=Error>, S::Future: 'static {

    fn handle_no_auth(&self, req: ServiceRequest) ->  Pin<Box<dyn
    futures_util::Future<Output=Result<ServiceResponse<EitherBody<B>>, Error>>>>{
        let token;

        {
            token = req.app_data::<web::Data<AppState>>().unwrap().token.lock().unwrap().clone();
        };
        let expires_in = token.created_at.0+token.expires_in as u64;

        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        if now > expires_in {
            let service = Rc::clone(&self.service);
            return async move {
                let token = RedisConnection::get_token().await;
                let conn = RedisConnection::get_connection();
                RedisConnection::save_token(conn.get_connection().unwrap(), token.clone());

                let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                {
                    let mut extracted_token = req.app_data::<web::Data<AppState>>().unwrap().token.lock().unwrap();
                    extracted_token.access_token = token.access_token;
                    extracted_token.expires_in = token.expires_in;
                    extracted_token.created_at = CreatedAt(current_time);
                    extracted_token.expires_in = token.expires_in;
                }
                return service
                    .call(req)
                    .await
                    .map(|res| res.map_into_left_body())
            }.boxed_local()
        }


        let service = Rc::clone(&self.service);
        async move {
            return service
                .call(req)
                .await
                .map(|res| res.map_into_left_body())
        }
            .boxed_local()
    }
}