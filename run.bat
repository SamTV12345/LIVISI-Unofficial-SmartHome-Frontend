@echo off


set BASE_URL=<your-base-url-to-livisi-shc>
REM Reminder: If your password contains a percentage sign, escape it with another percentage sign
set PASSWORD=<your-password>

REM Important otherwise windows username will be taken
set USERNAME=<your-username>

set AUTH_MODE=none

REM set AUTH_MODE=basic
REM set BASIC_USERNAME=<login-username>
REM set BASIC_PASSWORD=<login-password>

REM set OIDC_CLIENT_ID=your-oidc-client-id
REM set AUTH_MODE=oidc
REM set OIDC_REDIRECT_URI=your-oidc-redirect-uri
REM set OIDC_SCOPE=openid profile email
REM set OIDC_AUTHORITY=your-oidc-authority
REM set OIDC_AUDIENCE=your-oidc-audience

api.exe
