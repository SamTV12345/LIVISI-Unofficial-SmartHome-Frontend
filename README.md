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
    volumes:
      - "./db:/app/db"
    ports:
      - "80:8000"
    environment:
      - BASE_URL=<your-livsi-url>
      - PASSWORD=<your-livisi-password>
      - USERNAME=<your-livisi-username>
```

The url normally starts with http://<ip-address:8080 . Please don't add a / to the end of the url.
The username is currently hardcoded in every LIVISI product admin. The password can be retrieved from the serial number of the device.


## Deploying on Windows

1. Download the latest artifacts from the summary tab of the Build release binaries tab.
2. Extract the files to a folder.
3. Open the file run.bat in your favorite editor
4. Enter the base url e.g. `http://192.168.1.20:8080`
5. Enter the username, normally `admin`
6. Enter your livisi shc password
7. Run the script with `.\run.bat`
8. Visit the ip address of your computer on port 8000. You will be redirected to /ui.

# UI

The UI is available at /ui. It is a beautiful interface to view the cached data.

![charts](/docs/interface.png)

![Settings](/docs/settings.png)