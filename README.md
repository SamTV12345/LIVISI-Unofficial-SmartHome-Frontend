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
  gateway:
    image: samuel19982/gateway:latest
    ports:
      - "80:8000"
    environment:
      - BASE_URL=<your-livsi-url>
      - PASSWORD=<your-livisi-password>
      - USERNAME=<your-livisi-username>
    depends_on:
      - cache
  cache:
    image: redis:7.0.11
    restart: always
    ports:
      - '6379:6379'
    command: redis-server --save 20 1 --loglevel warning
    volumes:
      - cache:/data
```

The url normally starts with http://<ip-address:8080 . Please don't add a / to the end of the url.
The username is currently hardcoded in every LIVISI product admin. The password can be retrieved from the serial number of the device.

# UI

The UI is available at /ui. It is a beautiful interface to view the cached data.

![charts](/docs/interface.png)

![Settings](/docs/settings.png)