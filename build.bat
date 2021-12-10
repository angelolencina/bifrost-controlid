@echo off

call npm run build
rename build desko-secureid
xcopy .\.env.example .\desko-secureid\
xcopy .\install-windows-service.js .\desko-secureid\
xcopy .\uninstall-windows-service.js .\desko-secureid\
xcopy .\install.bat .\desko-secureid\
powershell  Compress-Archive -LiteralPath .\desko-secureid -DestinationPath .\releases\bifrost-controlid-v1.0.1.zip
rmdir /s /q desko-secureid
echo DONE!
PAUSE
EXIT
