#!/bin/bash
# =============================================================================
# GK.Server — Developer Setup Script (Linux/Debian & Windows WSL)
# =============================================================================
# Run this once after cloning to configure local connection strings.
# Secrets are stored OUTSIDE the repo and never committed.
#
# Prerequisites:
#   - .NET 9 SDK installed (https://dotnet.microsoft.com/download/dotnet/9.0)
#   - SQL Server accessible (local or remote)
#
# Usage:
#   chmod +x setup-dev.sh
#   ./setup-dev.sh
# =============================================================================

set -e

PROJECT_DIR="GK.Server"

echo "============================================"
echo " GK.Server — Local Development Setup"
echo "============================================"
echo ""

# --- Collect connection info ---
read -p "SQL Server host (e.g. localhost, 192.168.1.50): " DB_HOST
read -p "SQL Server port [1433]: " DB_PORT
DB_PORT=${DB_PORT:-1433}
read -p "Database name [GraphKnowledge]: " DB_NAME
DB_NAME=${DB_NAME:-GraphKnowledge}

echo ""
echo "Authentication mode:"
echo "  1) SQL Server login (username + password) — typical for Linux/remote"
echo "  2) Integrated / Trusted Connection — typical for Windows local"
read -p "Choose [1]: " AUTH_MODE
AUTH_MODE=${AUTH_MODE:-1}

if [ "$AUTH_MODE" = "2" ]; then
    CONN_STRING="Server=${DB_HOST},${DB_PORT};Database=${DB_NAME};Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
else
    read -p "SQL Username: " DB_USER
    read -sp "SQL Password: " DB_PASS
    echo ""
    CONN_STRING="Server=${DB_HOST},${DB_PORT};Database=${DB_NAME};User Id=${DB_USER};Password=${DB_PASS};MultipleActiveResultSets=true;TrustServerCertificate=true"
fi

echo ""
echo "Setting user secret..."
cd "$PROJECT_DIR"
dotnet user-secrets set "ConnectionStrings:GraphKnowledge" "$CONN_STRING"

echo ""
echo "============================================"
echo " Done! Secret stored locally at:"
echo "   Linux:   ~/.microsoft/usersecrets/"
echo "   Windows: %APPDATA%\\Microsoft\\UserSecrets\\"
echo ""
echo " To verify:  dotnet user-secrets list"
echo " To change:  re-run this script"
echo "============================================"
