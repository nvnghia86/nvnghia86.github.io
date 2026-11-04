const fs = require('node:fs');
const path = require('node:path');
const folder = path.join(__dirname, '../public/office');
require('./validate-office-manifest.cjs').validateManifest(fs.readFileSync(path.join(folder, 'quizzz-manifest.xml'), 'utf8'));
const powershell = fs.readFileSync(path.join(folder, 'install-windows.ps1'), 'utf8').trimEnd();
const wrapper = `@echo off
setlocal
title Quizzz - PowerPoint Add-in Setup
echo Quizzz PowerPoint add-in installer
echo Installs for the current Windows user. Administrator access is not required.
echo.
set "QUIZZZ_INSTALLER_FILE=%~f0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "try { $parts = [IO.File]::ReadAllText($env:QUIZZZ_INSTALLER_FILE) -split '(?m)^# QUIZZZ_POWERSHELL\\r?$', 2; if ($parts.Length -ne 2) { throw 'Invalid installer file.' }; & ([scriptblock]::Create($parts[1])) } catch { Write-Host $_.Exception.Message; exit 1 }"
set "QUIZZZ_INSTALL_EXIT=%ERRORLEVEL%"
echo.
if not "%QUIZZZ_INSTALL_EXIT%"=="0" echo Setup did not complete. See the message above.
pause
exit /b %QUIZZZ_INSTALL_EXIT%
# QUIZZZ_POWERSHELL
`;
fs.writeFileSync(path.join(folder, 'install-windows.bat'), (wrapper + powershell + '\n').replace(/\r?\n/g, '\r\n'), 'utf8');
