@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ถ้าภาษาไทยเพี้ยน เปลี่ยนเป็น 65001
chcp 437 >nul

REM =============== CONFIG ===============
set "TEXT_ONLY=1"               REM 1=เฉพาะไฟล์ text/code, 0=ทุกไฟล์
set "MAX_SIZE=2097152"          REM ขนาดสูงสุด (ไบต์) เพื่อกันไฟล์ใหญ่
set "PATTERNS=*.go;*.mod;*.sum;*.md;*.txt;*.json;*.yaml;*.yml;*.toml;*.ini;*.conf;*.cfg;*.html;*.htm;*.css;*.js;*.ts;*.tsx;*.vue;Dockerfile*;docker-compose.yml;.env;*.sample;*.py;*.sh;*.ps1;*.bat;*.cmd;*.log;*.gitignore;*.gitattributes"
REM =====================================

set /a __shown=0

echo.
echo ===== Displaying ALL files (recursive) =====
echo Root: %cd%
echo.

echo --- Tree snapshot ---
tree /f
echo.

if "%TEXT_ONLY%"=="1" (
  call :ScanByPatterns "%PATTERNS%"
) else (
  for /f "usebackq delims=" %%F in (`dir /s /b /a:-d 2^>nul`) do (
    call :DumpFile "%%~fF"
  )
)

echo.
echo Done. Files shown: %__shown%
endlocal
goto :eof


REM -------- Split patterns by ';' and scan each --------
:ScanByPatterns
setlocal EnableDelayedExpansion
set "PATS=%~1"
:__next
for /f "tokens=1* delims=;" %%a in ("!PATS!") do (
  set "ONE=%%~a"
  set "PATS=%%~b"
  if not "!ONE!"=="" (
    for /f "usebackq delims=" %%F in (`dir /s /b /a:-d "!ONE!" 2^>nul`) do (
      call :DumpFile "%%~fF"
    )
  )
)
if defined PATS goto :__next
endlocal
goto :eof


REM ---------------- DumpFile ----------------
:DumpFile
set "F=%~1"
if not exist "%F%" goto :eof

REM ข้ามไฟล์ใต้ .git ทั้งหมด
echo "%F%" | findstr /i /c:".git\" >nul
if not errorlevel 1 goto :eof

for %%A in ("%F%") do set "SZ=%%~zA"

set /a SKIP=0
if defined MAX_SIZE set /a SKIP=(%SZ% GEQ %MAX_SIZE%)

echo ------------------------------------------------------------
echo File: %F%
echo Size: %SZ% bytes
echo ------------------------------------------------------------

if %SKIP% NEQ 0 (
  echo [Skipped: file larger than %MAX_SIZE% bytes]
  echo.
  goto :eof
)

type "%F%"
echo.

set /a __shown+=1
goto :eof
