@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
)
:: Stopping and removing deskbee service
call npm link node-windows
node .\uninstall-deskbee-service-windows.js
:: Deskbee service stopped and removed
PAUSE
EXIT
