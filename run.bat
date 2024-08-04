@echo off


set BASE_URL=<your-base-url-to-livisi-shc>
REM Reminder: If your password contains a percentage sign, escape it with another percentage sign
set PASSWORD=<your-password>

REM Important otherwise windows username will be taken
set USERNAME=<your-username>


REM set BASIC_USERNAME=login-username
REM set BASIC_PASSWORD=login-password
REM set BASIC_AUTH=true

REM set OIDC_CLIENT_ID=your-oidc-client-id
REM set OIDC_AUTH=true
REM set OIDC_REDIRECT_URI=your-oidc-redirect-uri
REM set OIDC_SCOPE=your-oidc-scope
REM set OIDC_AUTHORITY=your-oidc-authority

api.exe