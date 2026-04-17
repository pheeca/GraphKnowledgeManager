@echo off
REM =============================================================================
REM GK.Server — Developer Setup Script (Windows)
REM =============================================================================
REM Run this once after cloning to configure local connection strings.
REM Secrets are stored OUTSIDE the repo and never committed.
REM
REM Prerequisites:
REM   - .NET 9 SDK installed
REM   - SQL Server accessible (local or remote)
REM
REM Usage:
REM   setup-dev.cmd
REM =============================================================================

echo ============================================
echo  GK.Server — Local Development Setup
echo ============================================
echo.

set /p DB_HOST="SQL Server host (e.g. localhost, .\SQLEXPRESS): "
set /p DB_PORT="SQL Server port [1433]: "
if "%DB_PORT%"=="" set DB_PORT=1433
set /p DB_NAME="Database name [GraphKnowledge]: "
if "%DB_NAME%"=="" set DB_NAME=GraphKnowledge

echo.
echo Authentication mode:
echo   1) SQL Server login (username + password)
echo   2) Integrated / Trusted Connection (Windows auth)
set /p AUTH_MODE="Choose [2]: "
if "%AUTH_MODE%"=="" set AUTH_MODE=2

if "%AUTH_MODE%"=="1" (
    set /p DB_USER="SQL Username: "
    set /p DB_PASS="SQL Password: "
    set CONN_STRING=Server=%DB_HOST%,%DB_PORT%;Database=%DB_NAME%;User Id=%DB_USER%;Password=%DB_PASS%;MultipleActiveResultSets=true;TrustServerCertificate=true
) else (
    set CONN_STRING=Server=%DB_HOST%;Database=%DB_NAME%;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true
)

echo.
echo Setting user secret...
cd GK.Server
dotnet user-secrets set "ConnectionStrings:GraphKnowledge" "%CONN_STRING%"

echo.
echo ============================================
echo  Done! Secret stored at:
echo    %%APPDATA%%\Microsoft\UserSecrets\
echo.
echo  To verify:  dotnet user-secrets list
echo  To change:  re-run this script
echo ============================================
pause
