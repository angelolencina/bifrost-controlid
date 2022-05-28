@echo off
setlocal
set intall_dir="C:\ProgramData\Bifrost"
if exist %intall_dir% (
    rmdir /s /q %intall_dir%
) 
set DIR="C:\Temp"
set build_dir="C:\Temp\build"
set installf = "C:\Temp\build\install.bat"
tar -xf build.zip -C %DIR%
cd %build_dir%
call "install.bat"



exit /b