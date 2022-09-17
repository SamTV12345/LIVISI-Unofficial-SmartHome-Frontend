# Repository for a new updated design for the new local innogy smarthome 

This repository contains a third party ui for the innogy local smarthome that can be run on your raspberry pi.
The advantage is that the smarthome (SH) doesn't need to serve the files thus offering better speed. 
The communication is done via the local REST-API.


## Current features
- Login and retrieve OAuth2.0 token.
- Retrieve locations and devices.

## Getting started

### Prerequisites
- Linux PC (Raspberry PI, x86 PC etc.)

### Starting
- Run the following commands

```
chmod +x prepareInstallation.sh
./prepareInstallation.sh
```

During setup, you are prompted to enter your smarthome ip address (visible in the app).

⚠ **Please enter it without the last /** ⚠