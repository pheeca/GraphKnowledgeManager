# GraphKnowledgeManager — Copilot Instructions

## Project Overview

Knowledge Graph Visualization & Management Platform. Users create graph-based knowledge schemas (nodes + edges) via a vis.js network UI, with versioning (undo/redo) and multi-schema workspaces.

- **Live URL:** https://graphknowledge.pheeca.com
- **Branch `upgrage`:** Active migration from .NET Framework 4.6.1 → .NET 9

## Architecture

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Vanilla JS + jQuery 3.7 + Bootstrap 4 + vis.js Network | `Scripts/`, `Content/`, `index.html`, `*.tmp.html` |
| Backend (NEW) | .NET 9 Web API + Dapper | `GraphKnowledgeServer/GK.Server/`, `GraphKnowledgeServer/GK.DataAccess/` |
| Backend (LEGACY) | .NET Framework 4.6.1 + EF6 | `GraphKnowledgeServer/GraphKnowledgeServer/`, `GraphKnowledgeServer/DataAccess/` |
| Database | SQL Server | `GraphKnowledgeServer/Database/` (.sqlproj) |
| Real-time (LEGACY) | SignalR 2 + custom EventBus | `GraphKnowledgeServer/EventBus/` — currently disabled, migration deferred |

## Migration Context

The system is mid-migration from .NET Framework to .NET 9. See `GraphKnowledgeServer/MIGRATION.md` for status. When working on backend code:
- **All new work goes in `GK.Server` and `GK.DataAccess`** — never modify legacy projects
- Legacy projects (`GraphKnowledgeServer/`, `DataAccess/`, `EventBus/`) are reference-only
- EventBus/SignalR migration is deferred — do not attempt to port it

## Build & Run

```bash
# Copy frontend assets to wwwroot
npm start

# Configure DB connection (first time)
cd GraphKnowledgeServer/GK.Server
dotnet user-secrets set "ConnectionStrings:GraphKnowledge" "<connection-string>"
# Or use setup-dev.cmd / setup-dev.sh

# Run API server
cd GraphKnowledgeServer/GK.Server
dotnet run
```

The server serves static files from `wwwroot/` — frontend is hosted by the same .NET process.

## Database Schema

Three tables with simple versioning:

- **Users** (`UserId`, `Username`, `Password`) — identity, no hashing yet
- **UserSchema** (`UserSchemaId`, `SchemaName`, `SchemaDesc`, `OwnerUserId` → Users)
- **SchemaInformation** (`Id` BIGINT, `SchemaInfo` NVARCHAR(MAX) JSON, `CreationDate`, `UserSchemaId` → UserSchema, `ModifiedBy`, `Status`)

Version control: multiple `SchemaInformation` rows per `UserSchemaId`; exactly one marked `Status = "Active"`. Undo/redo flips status in a transaction.

## API Endpoints (GK.Server)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/userauth` | Login (FormData: username, password) |
| GET | `/api/userauth/{id}` | Get user's schemas |
| POST | `/api/user` | Register |
| GET | `/api/userschema/{id}` | Get schemas by owner |
| POST | `/api/userschema` | Create schema |
| GET | `/api/values` | Get latest schema info |
| GET | `/api/values/{id}` | Get active schema for UserSchemaId |
| POST | `/api/values/{id}` | Save schema version (FormData: SchemaInfo, ModifiedBy) |
| PUT | `/api/values/{id}?mode=undo\|redo` | Undo/redo |
| GET | `/Home/template?templateName=` | Serve HTML template from wwwroot/Templates/ |

## Code Conventions

### Backend (.NET 9)
- **Repository pattern**: `I{Name}Repository` interface + `{Name}Repository` implementation with Dapper
- **DI**: Repositories registered as Scoped; `IDbConnectionFactory` as Singleton
- **Controllers**: `[Route("api/[controller]")]`, inherit `ControllerBase`
- **DTOs**: in `Models/Dtos.cs` — suffix `Request` or `Store` (e.g., `LoginRequest`, `SchemaStore`)
- **Constants**: `Constants.Active` / `Constants.InActive` (static properties)
- **No authentication middleware** — user ID passed via session/form data

### Frontend (Vanilla JS)
- **Module pattern**: `var moduleName = moduleName || {}` with IIFE namespaces
- **Event-driven**: `EventBus.dispatch('eventName', params)` / `EventBus.addEventListener()`
- **Event naming**: dot-separated PascalCase for app events (`UI.Web.App.Route.Main`), camelCase for data events (`selectNode`, `saveGraph`)
- **Session state**: `sessionStorage.UserId`, `sessionStorage.UserSchemaId`, `sessionStorage.routeParams`
- **Hash routing**: `app.js` handles `#route` navigation, loads templates via `/Home/template`
- **Data service**: `services.client.dataservice` — in-memory graph node/edge CRUD with jQuery AJAX to API
- **No bundler/transpiler** — plain ES5 scripts loaded via `<script>` tags

### Database
- PascalCase for tables and columns
- Constraints: `PK_{Table}`, `FK_{Table}_{Referenced}`

## Known Issues & Tech Debt

- **Passwords stored in plaintext** — no hashing in login or registration
- **Hardcoded fallback user** in `UserAuthController.Post()` returns `{ UserId=1, Username="pheeca", Password="1234" }` on null login — remove before production
- **CORS wide open** — `AllowAnyOrigin()` in Program.cs needs restriction
- **No input validation** on API endpoints
- **ModifiedBy** column in SchemaInformation has no FK constraint
- **EventBus/SignalR** disabled — real-time sync not functional

## File Organization

```
/                           # Frontend source (copied to wwwroot via npm start)
├── Scripts/                # JS modules
├── Content/                # CSS + images
├── *.tmp.html              # Dynamic HTML templates
├── index.html              # SPA entry point
├── package.json            # npm copy scripts
│
└── GraphKnowledgeServer/   # .NET solution root
    ├── GK.Server/          # NEW .NET 9 Web API (active development)
    ├── GK.DataAccess/      # NEW .NET 9 data layer (Dapper + repositories)
    ├── Database/           # SQL Server project (.sqlproj)
    ├── GraphKnowledgeServer/ # LEGACY .NET Framework API (reference only)
    ├── DataAccess/         # LEGACY EF6 data layer (reference only)
    └── EventBus/           # LEGACY SignalR hub (disabled, deferred)
```
