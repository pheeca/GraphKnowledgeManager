# GraphKnowledgeServer

## Projects

| Project | Framework | Purpose |
|---------|-----------|---------|
| **GK.Server** | .NET 9 Web API | New API server (migration target) |
| **GK.DataAccess** | .NET 9 Class Library | Data access layer with Dapper |
| **GraphKnowledgeServer** | .NET Framework 4.6.1 | Legacy ASP.NET MVC + Web API 2 |
| **EventBus** | .NET Framework 4.6.1 | SignalR message bus (legacy) |
| **DataAccess** | .NET Framework 4.6.1 | EF6 Database-First models (legacy) |
| **Database** | SQL Server project | Schema definitions |

## Quick Start

### Prerequisites
- .NET 9 SDK
- SQL Server (local or remote)

### 1. Clone & configure connection string

Connection strings are stored as **user secrets** (never in the repo).

**Windows:**
```cmd
setup-dev.cmd
```

**Linux / macOS / WSL:**
```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

**Manual alternative:**
```bash
cd GK.Server
dotnet user-secrets set "ConnectionStrings:GraphKnowledge" "Server=localhost;Database=GraphKnowledge;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
```

### 2. Verify secrets
```bash
cd GK.Server
dotnet user-secrets list
```

### 3. Run
```bash
cd GK.Server
dotnet run
```

### Linux/Debian Deployment Notes

For production on Linux, set the connection string via **environment variable** instead of user secrets:

```bash
export ConnectionStrings__GraphKnowledge="Server=YOUR_HOST;Database=GraphKnowledge;User Id=YOUR_USER;Password=YOUR_PASS;MultipleActiveResultSets=true;TrustServerCertificate=true"
```

Or in a systemd service file:
```ini
[Service]
Environment=ConnectionStrings__GraphKnowledge=Server=...;Database=GraphKnowledge;User Id=...;Password=...;MultipleActiveResultSets=true;TrustServerCertificate=true
```

Or use an `.env` file loaded by your deployment tooling.

**Priority order** (automatic in .NET): User Secrets (dev) → Environment Variables (prod) → appsettings.json (fallback placeholder).

## Migration Status

See `MIGRATION.md` for what has been migrated and what remains.
