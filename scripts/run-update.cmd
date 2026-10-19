@echo off
rem Run by Windows Task Scheduler (task "GlobalTechDigestUpdate"). Output of the last run: data\last-update.log
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0.."
if not exist data mkdir data
echo %date% %time% > data\last-update.log
call npm run update >> data\last-update.log 2>&1
echo exit code %errorlevel% >> data\last-update.log
