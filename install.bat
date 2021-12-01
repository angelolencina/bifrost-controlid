@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
)

set NODE_VER=null
set NODE_EXEC=node-v16.13.0-x64.msi
set SETUP_DIR=%CD%
node -v >tmp.txt
set /p NODE_VER=<tmp.txt
del tmp.txt

IF "%NODE_VER%"=="%NULL_VAL%" (
	echo.
	echo Node.js is not installed! Please press a key to download and install it from the website that will open.
	PAUSE
	start "" https://nodejs.org/dist/v16.13.0/node-v16.13.0-x64.msi
	echo.
	echo.
	echo After you have installed Node.js, press a key to shut down this process. Please restart it again afterwards.
	PAUSE
	EXIT
) ELSE (
	echo A version of Node.js ^(%NODE_VER%^) is installed. Proceeding...
)

echo INSTALLING packageas ...
echo %SETUP_DIR%
call npm ci --production
call npm install -g node-windows
call npm link node-windows
node .\install-windows-service.js
echo DONE!
PAUSE
EXIT