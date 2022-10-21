@echo off

SET PM2_HOME = C:\etc\.pm2

pm2 start "C:\ProgramData\gateway\build\server.js" --name deskbee-gateway


