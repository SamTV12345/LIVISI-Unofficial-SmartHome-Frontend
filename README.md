# Unofficial LIVISI Gateway


This is a community project and is not affiliated with LIVISI in any way. It enables a higher performance by caching

- Locations
- Devices
- Capabilities (The things a device can perform)

as they won't change often. This results in an incredible performance boost as now only 3 other requests need to be performed on device.


## Deploying

```yaml
version: '3'
services:
  postgres:
    image: postgres:17-alpine
    environment:
      - POSTGRES_DB=smarthome
      - POSTGRES_USER=smarthome
      - POSTGRES_PASSWORD=smarthome
    volumes:
      - postgres-data:/var/lib/postgresql/data

  gateway:
    image: samuel19982/gateway:latest
    depends_on:
      - postgres
    volumes:
      - "./db:/app/db"
    ports:
      - "80:8000"
    environment:
      - BASE_URL=<your-livsi-url>
      - DATABASE_URL=postgres://smarthome:smarthome@postgres:5432/smarthome
      - PASSWORD=<your-livisi-password>
      - USERNAME=<your-livisi-username>
      - AUTH_MODE=none

volumes:
  postgres-data:
```

The url normally starts with http://<ip-address:8080 . Please don't add a / to the end of the url.
The username is currently hardcoded in every LIVISI product admin. The password can be retrieved from the serial number of the device.
`DATABASE_URL` is required for sentry mode settings and notification provider credentials. The default Docker setup above provisions PostgreSQL automatically.

## Sentry Mode

The settings menu now contains a dedicated `Sentry Mode` page.

- Supported realtime source: door/window contact sensors (`WDS`).
- Supported providers: `Telegram` and generic `Webhook`.
- Persistence: sentry mode state, monitored sensors, and provider credentials are stored in PostgreSQL.

### Telegram Provider

The Telegram interface is already implemented in the backend and can be configured in the UI under `Settings -> Sentry Mode`.

Required fields:

- `Bot Token`: Telegram bot token from `@BotFather`
- `Chat ID`: target chat or group id

Optional field:

- `Message Thread ID`: required only when you want to send into a specific forum topic in a Telegram supergroup

Setup flow:

1. Open Telegram and start a chat with `@BotFather`
2. Send `/newbot`
3. Follow the prompts from `@BotFather`
4. Choose a display name for the bot
5. Choose a unique bot username ending in `bot`, for example `livisi123434_bot`
6. Copy the bot token returned by `@BotFather`
7. Open a direct chat with your new bot and send `/start`
8. Open this URL in your browser:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

9. Look for the `chat.id` field in the JSON response, for example:

```json
{
  "message": {
    "chat": {
      "id": 123456789,
      "type": "private"
    }
  }
}
```

10. Use that numeric `chat.id` value as `Chat ID` in the UI
11. Open the Sentry Mode page in the UI
12. Select `Telegram` as provider
13. Enter `Bot Token` and `Chat ID`
14. Optionally enter `Message Thread ID`
15. Save the settings
16. Use `Send Test Notification`

Important:

- The bot username like `@livisi123434_bot` is not the chat id.
- For a private chat you usually get a positive numeric `chat.id`.
- For groups or supergroups you usually get a negative `chat.id`, often starting with `-100`.
- If you want to send to a group, add the bot to the group first and send at least one message there before calling `getUpdates`.

Notes:

- If no specific sensors are selected, all supported `WDS` sensors are monitored.
- Telegram messages are sent whenever a monitored contact sensor changes its `isOpen` state.
- Credentials are stored in PostgreSQL via the sentry settings record.

Relevant backend endpoints:

- `GET /sentry/settings`
- `PUT /sentry/settings`
- `POST /sentry/test`

## Authentication Modes

`AUTH_MODE` controls how the UI and API are protected:

- `AUTH_MODE=none`: No authentication required.
- `AUTH_MODE=basic`: Browser/API require HTTP Basic authentication.
- `AUTH_MODE=oidc`: Browser/API require OIDC bearer tokens (e.g. Keycloak, Authelia).

### Basic Auth

```yaml
environment:
  - AUTH_MODE=basic
  - BASIC_USERNAME=<your-login-username>
  - BASIC_PASSWORD=<your-login-password>
```

### OIDC

```yaml
environment:
  - AUTH_MODE=oidc
  - OIDC_CLIENT_ID=<your-oidc-client-id>
  - OIDC_REDIRECT_URI=<https://your-host/ui/>
  - OIDC_AUTHORITY=<https://your-provider-authority>
  - OIDC_SCOPE=openid profile email
  - OIDC_AUDIENCE=<optional-audience-override>
```


e.g. with Keycloak:

```yaml
  - name: "AUTH_MODE"
    value: "oidc"
  - name: "OIDC_CLIENT_ID"
    value: "smarthome"
  - name: "OIDC_REDIRECT_URI"
    value: "https://smarthome.example.com/ui/"
  - name: "OIDC_SCOPE"
    value: "openid profile email"
  - name: "OIDC_AUTHORITY"
    value: "https://sso.keycloak.example/realms/prod"
```

Notes:

- `OIDC_AUDIENCE` is optional. Set it if your provider expects a specific audience check.
- `OIDC_AUTHORITY` must expose a valid `/.well-known/openid-configuration` endpoint.


## Deploying on Windows

1. Download the latest artifacts from the summary tab of the Build release binaries tab.
2. Extract the files to a folder.
3. Open the file run.bat in your favorite editor
4. Enter the base url e.g. `http://192.168.1.20:8080`
5. Enter the username, normally `admin`
6. Enter your livisi shc password
7. Set `AUTH_MODE` (`none`, `basic`, or `oidc`) and related variables if needed
8. Set `DATABASE_URL` to your PostgreSQL instance, for example `postgres://smarthome:smarthome@localhost:5432/smarthome`
9. Run the script with `.\run.bat`
10. Visit the ip address of your computer on port 8000. You will be redirected to /ui.

# UI

The UI is available at /ui/. It is a beautiful interface to view the cached data.

![charts](/docs/interface.png)

![Settings](/docs/settings.png)
