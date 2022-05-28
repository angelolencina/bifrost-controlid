@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
)


node -v >tmp.txt
set /p NODE_VER=<tmp.txt
set BASE_DIR=C:\ProgramData\Bifrost
if exist %BASE_DIR% (
    rmdir /s /q %BASE_DIR%
)
set NODE_RECOMMENDED_VER=v14.15.0
set NODE_EXEC=node-v14.15.0-x64.msi
set SETUP_DIR=%CD%
echo Checking Node version...
IF "%NODE_VER%"=="%NODE_RECOMMENDED_VER%" (
	echo A version of Node.js ^(%NODE_VER%^) is installed. Proceeding...
) ELSE (
	echo Node.js is not installed! Please press a key to download and install it from the website that will open.
	mkdir tmp
	IF NOT EXIST tmp/%NODE_EXEC% (
		echo Node setup file does not exist. Downloading ...
		cd ../bin
		START /WAIT curl.exe --output %NODE_EXEC% --url https://nodejs.org/dist/%NODE_RECOMMENDED_VER%/%NODE_EXEC%
		move %NODE_EXEC% %SETUP_DIR%/tmp
	)
	cd %SETUP_DIR%/tmp
	START /WAIT %NODE_EXEC%
	cd %SETUP_DIR%
)
echo.

echo.
mkdir %BASE_DIR%
xcopy /s %SETUP_DIR% %BASE_DIR%
PushD %BASE_DIR%
set SETUP_DIR=%CD%
echo %SETUP_DIR%
echo.
echo INSTALLING packages ...
echo.
call npm ci --production
call npm i -g node-windows@1.0.0-beta.6
call npm link node-windows
node .\install-deskbee-service-windows.js
echo.
echo DONE!



