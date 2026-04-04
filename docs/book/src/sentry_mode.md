# Sentry Mode

`Sentry Mode` sends door and window contact changes to a configurable notification provider.

## Current Scope

- Supported sensor type: `WDS`
- Trigger source: realtime `isOpen` changes from the websocket stream
- Persistence: PostgreSQL
- Providers:
  - `Telegram`
  - `Webhook`

## Telegram

The Telegram provider is implemented already.

Required configuration:

- `bot_token`
- `chat_id`

Optional configuration:

- `message_thread_id`

### Setup

1. Create a bot with `@BotFather`
2. Add the bot to the target chat or group
3. Send a first message so Telegram exposes the chat to the Bot API
4. Open `Settings -> Sentry Mode`
5. Select `Telegram`
6. Fill in the bot token and chat id
7. Save the settings
8. Trigger `Send Test Notification`

### Behavior

- If `monitored_device_ids` is empty, all supported `WDS` sensors are monitored.
- If `enabled` is `false`, no notification is sent.
- Notifications are sent when a sensor changes between open and closed.

## API

- `GET /sentry/settings`
- `PUT /sentry/settings`
- `POST /sentry/test`

Example payload:

```json
{
  "enabled": true,
  "monitored_device_ids": [
    "abc123"
  ],
  "provider": {
    "kind": "telegram",
    "bot_token": "123456:token",
    "chat_id": "-1001234567890",
    "message_thread_id": 42
  }
}
```
