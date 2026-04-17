# Migration Status: .NET Framework 4.6.1 → .NET 9

## What's Done

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

## What Remains

### 1. Data Access Layer (GK.DataAccess)
- [ ] Add a `DbConnectionFactory` or similar to create `SqlConnection` from config
- [ ] Create Dapper-based repository classes replacing EF6 `GraphKnowledgeEntities`:
  - `UserRepository` — login validation, registration
  - `UserSchemaRepository` — CRUD for schemas by owner
  - `SchemaInformationRepository` — get/create/activate schema versions
- [ ] Wire up connection string from `IConfiguration` via DI

### 2. Controllers (GK.Server)
Migrate from Web API 2 `ApiController` to ASP.NET Core `ControllerBase`:

- [ ] **UserAuthController** → `api/userauth`
  - `GET {id}` — get user schemas by owner
  - `POST` — login (username + password validation)
  - NOTE: Currently uses plain-text password comparison + hardcoded fallback user
  
- [ ] **UserController** → `api/user`
  - `POST` — user registration (duplicate check + insert)
  
- [ ] **UserSchemaController** → `api/userschema`
  - `GET {id}` — get schemas by owner
  - `POST` — create schema
  - `PUT` / `DELETE` — stubs (not implemented in legacy)
  
- [ ] **ValuesController** → `api/values`
  - `GET` — latest schema info
  - `GET {id}` — active schema for UserSchemaId (auto-activates latest if none active)
  - `POST {id}` — create new schema version

- [ ] **HomeController** (MVC)
  - `Template(name)` — serves file from Templates folder
  - Decide: migrate as static file serving or skip (may not be needed for API-only server)

### 3. Models & DTOs
- [ ] Move `SchemaStore` model (DTO for schema POST) to GK.Server or shared project
- [ ] Move `ViewModel.User` (login/register DTO) to GK.Server
- [ ] Move `Constants` (Active/InActive status strings) to GK.DataAccess or shared

### 4. EventBus / SignalR
- [ ] Decide: migrate EventBus to .NET 9 SignalR or defer
  - Legacy EventBus uses reflection-based `[OnEvent]` routing + OWIN SignalR
  - Currently **commented out** in Global.asax — not actively used
  - Could be replaced with .NET 9 SignalR Hub + MediatR/channels if needed later

### 5. Configuration & Infrastructure
- [x] Connection string via user secrets (done)
- [ ] Add `GK.DataAccess` project reference to `GK.Server.csproj`
- [ ] Register repositories in DI (`Program.cs`)
- [ ] Remove `WeatherForecast` scaffold files
- [ ] Restrict CORS origins (currently allows all)

### 6. Not Migrating (Legacy Only)
- HelpPage area (auto-generated API docs — replaced by OpenAPI/Swagger)
- BundleConfig (no frontend bundling needed in API server)
- MVC Views/Razor (API-only server)
- Application Insights config (use modern `AddApplicationInsightsTelemetry()` if needed)
