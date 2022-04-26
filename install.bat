@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
)

set NODE_VER=null
set NODE_EXEC=node-v16.13.0-x64.msi
set SETUP_DIR=%CD%
set BASE_DIR=C:\ProgramData\Bifrost\
mkdir %BASE_DIR%
xcopy /s %SETUP_DIR% %BASE_DIR%
PushD %BASE_DIR%
set SETUP_DIR=%CD%
node -v >tmp.txt
set /p NODE_VER=<tmp.txt
del tmp.txt

IF "%NODE_VER%"=="%NULL_VAL%" (
	echo.
	echo Node.js is not installed! Please press a key to download and install it from the website that will open.
	PAUSE
	start "" https://nodejs.org/dist/v14.15.0/node-v14.15.0-x64.msi
	echo.
	echo.
	echo After you have installed Node.js, press a key to shut down this process. Please restart it again afterwards.
	PAUSE
	EXIT
) ELSE (
	echo A version of Node.js ^(%NODE_VER%^) is installed. Proceeding...
)

echo INSTALLING packages ...
echo %SETUP_DIR%
call npm ci --production
call npm i -g node-windows@1.0.0-beta.6
call npm link node-windows
node .\install-deskbee-service-windows.js
echo DONE!
PAUSE
EXIT
