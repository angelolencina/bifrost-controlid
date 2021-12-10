@echo off

call npm run build
rename build desko-idsecure
xcopy .\.env.example .\desko-idsecure\
xcopy .\install-windows-service.js .\desko-idsecure\
xcopy .\uninstall-windows-service.js .\desko-idsecure\
xcopy .\install.bat .\desko-idsecure\
powershell  Compress-Archive -LiteralPath .\desko-idsecure -DestinationPath .\releases\bifrost-controlid-v1.0.1.zip
rmdir /s /q desko-idsecure
echo DONE!
PAUSE
EXIT
