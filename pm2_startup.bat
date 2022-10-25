@echo off

SET PM2_HOME = C:\deskbee-gateway\.pm2
SET BASE_DIR=C:\ProgramData\gateway\build
PushD %BASE_DIR%
pm2 start "server.js" --name deskbee-gateway


