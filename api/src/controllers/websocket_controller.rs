use actix_web::{Error, get, HttpRequest, HttpResponse};
use actix_web::web::Payload;
use actix_web_actors::ws;
use crate::ws::web_socket::WsConn;

#[get("/websocket")]
pub async fn start_connection(
    req: HttpRequest,
    stream: Payload,
) -> Result<HttpResponse, Error> {
    let ws = WsConn::new();
    let resp = ws::start(ws, &req, stream)?;
    Ok(resp)
}