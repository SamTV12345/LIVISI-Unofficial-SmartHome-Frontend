use redis::{Client, Connection};

#[derive(Clone)]
pub struct RedisConnection{
}

impl RedisConnection{
    pub fn get_connection() -> Client {
        return Client::open("redis://192.168.2.117").unwrap();

    }

    pub fn get_redis_connection(client: Client) -> Connection {
        return client.get_connection().unwrap();
    }

    pub fn save_to_redis(mut client: Connection, key: &str, value: &str) {
        redis::cmd("SET").arg(key).arg(value).execute(&mut client);
    }

    pub fn get_from_redis(mut conn: Connection, key: &str) -> String {
        let res:redis::RedisResult<String> = redis::cmd("GET").arg(key).query(&mut conn);
        return res.unwrap();
    }
}
