@echo off
cd /d c:\TUHOCLAPTRINH\kigyou-list
powershell.exe -ExecutionPolicy Bypass -File scripts\restart_all_yahoo.ps1 > scratch\restart_bat.log 2>&1
