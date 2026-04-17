# Migration Status: .NET Framework 4.6.1 → .NET 9

## Infrastructure Done

| Item | Status |
|------|--------|
| GK.Server project created (.NET 9 Web API) | ✅ |
| GK.DataAccess class library created (.NET 9) | ✅ |
| Model POCOs copied (User, UserSchema, SchemaInformation) | ✅ |
| Dapper added to both projects | ✅ |
| CORS configured in Program.cs | ✅ |
| OpenAPI enabled | ✅ |
| User secrets configured | ✅ |
| Solution updated with new projects | ✅ |

## What's Done (Migration)

### Data Access Layer (GK.DataAccess)
- [x] `DbConnectionFactory` / `IDbConnectionFactory` — creates `SqlConnection` from config
- [x] `UserRepository` — login validation, registration (Dapper)
- [x] `UserSchemaRepository` — CRUD for schemas by owner (Dapper)
- [x] `SchemaInformationRepository` — get/create/activate schema versions, undo/redo (Dapper)
- [x] `Constants` class (`Active` / `InActive` status strings)
- [x] Connection string wired via DI (`IDbConnectionFactory` singleton)

### Controllers (GK.Server)
- [x] **UserAuthController** → `api/userauth` — login + get schemas
- [x] **UserController** → `api/user` — registration
- [x] **UserSchemaController** → `api/userschema` — get by owner + create
- [x] **ValuesController** → `api/values` — get latest, get active, create version, undo/redo
- [x] **HomeController** → `/Home/template` — serves HTML templates from wwwroot/Templates/

### Models & DTOs
- [x] `LoginRequest` DTO in `Models/Dtos.cs`
- [x] `SchemaStore` DTO in `Models/Dtos.cs`

### Configuration & Infrastructure
- [x] Connection string via user secrets
- [x] `GK.DataAccess` project reference added
- [x] Repositories registered in DI (`Program.cs`)
- [x] WeatherForecast scaffold files removed

## What Remains

### 1. Security
- [ ] Hash passwords (currently plaintext comparison)
- [ ] Remove hardcoded fallback user in `UserAuthController.Post()` — returns `{ UserId=1, Username="pheeca", Password="1234" }` on null login
- [ ] Restrict CORS origins (currently `AllowAnyOrigin()`)
- [ ] Add input validation on API endpoints

### 2. Data Integrity
- [ ] Add FK constraint for `ModifiedBy` column in SchemaInformation

### 3. EventBus / SignalR
- [ ] Deferred — legacy EventBus uses reflection-based `[OnEvent]` routing + OWIN SignalR
  - Currently **commented out** in Global.asax — not actively used
  - Could be replaced with .NET 9 SignalR Hub if needed later

### 4. Not Migrating (Legacy Only)
- HelpPage area (replaced by OpenAPI/Swagger)
- BundleConfig (no frontend bundling needed)
- MVC Views/Razor (API-only server)
- Application Insights config (use modern `AddApplicationInsightsTelemetry()` if needed)
