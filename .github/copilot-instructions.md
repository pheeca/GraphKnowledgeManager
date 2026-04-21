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

## Legacy Frontend Deep Dive (Current Production UI — v1)

The live UI is an SPA with **one static shell (`index.html`)**, **hash routing**, and **HTML template fragments** pulled via AJAX and injected into `#pageSection`. All interactivity is wired through a **global custom EventBus** (`eventbus.min.js`) — there is no framework, no bundler, no transpiler, no TypeScript.

### Boot sequence (`index.html` → `app.js`)

1. `index.html` loads, in strict order: jQuery 3.7 → Popper → Bootstrap 4 → vis-network → eventbus.min → bootstrap-datepicker → fstdropdown → utilities → jQuery.signalR → `/signalr/js` (SignalR generated hub proxy — **404s on .NET 9 server, ignored**) → `signalrEventBus.js` → last: `app.js`.
2. `$(document).ready` in `app.js`: if `window.location.hash` is empty, seeds it to `/Graph` when `sessionStorage.UserId + UserSchemaId` both exist, else `/Login`. Then fires `EventBus.dispatch('UI.Web.App.UiChanged')`.
3. `UI.Web.App.UiChanged` handler:
   - Empties `#pageSection`.
   - Walks `AppRoutes[]` (three entries: `/Graph/:UserSchemaId/:NodeId/:key`, `/Graph`, `/Login`) to match current hash, extracting route params.
   - GETs `/Home/template?Templatename={file}&_={ts}` (cache-busted), then `$('#pageSection').html(response)` to inject the fragment.
   - Persists `routeParams` to `sessionStorage`, checks `isAuthenticated`, then dispatches the route's event (`UI.Web.App.Route.Login` or `UI.Web.App.Route.Main`).
4. `UI.Web.App.Route.Main` handler → fires `onGraphEnabled` (defined in `graphExplorer.js`) which does the actual graph bootstrap.
5. `UI.Web.App.Redirect` sets `location.hash` and re-fires `UiChanged`. `UI.Web.App.Logout` clears `sessionStorage` and redirects to `/Login`.

### Templates (loaded into `#pageSection`)

- **`loginpanels.tmp.html`** — login form (`#email`, `#password`), "User Create" button, schema list (`#schemaname`), "Add Graph" modal (`#GraphPopup`). Loads `Scripts/login.js` inline at the bottom.
- **`mainpanels.tmp.html`** — *currently a new mockup (work-in-progress, not yet wired)*.
- **`mainpanels.tmp1.html`** — the **real legacy main UI** (snapshot kept for reference). The live production page is structurally equivalent to this file. It loads `tagsinput.js`, `services.js`, `graphExplorer.js`, `bootstrap-select.min.js` inline at the bottom, then sets `#mynetwork` height to 85vh on `document.ready`.

### `mainpanels.tmp1.html` structure (legacy live UI)

Top bar (2-row Bootstrap grid) contains:
- Version label + `#updatemsg` status line (shows "Last Saved: …")
- Toolbar buttons: Save / + Add Node / Logout / Undo / Redo (each fires an EventBus event)
- Search box `#search` + Global toggle `#ContextGlobal` + multi-select `#searchmode` (values: `tag` / `node` / `properties`)
- `#nLevelNeighbouringNode` number input + `#neighbouringNodesSwitch` checkbox
- `#representationstyle` select — `graph` (default, force) or `hierarchical`

Main area (`row h-75`):
- Left 9/12: **`#mynetwork`** — the vis.js Network canvas.
- Right 3/12: `#panel` shown when a node is selected, `#generalpanel` ("Go to Parent") when nothing is selected. `#panel` hosts **4 Bootstrap tabs**:
  1. **Properties** (`#proppanel`) — table `#properties` of {key, value, date}, "Open" button (drill down), "+ Add" opens `#myModal`.
  2. **Graph Editor** (`#grapheditorpanel`) — Delete Node (`#myModal2`), + Edit Node (`#myModal4`), + Add Relation (`#myModal3`), + Add Nodes/Edges (`#myModal5`), and table `#edges` of connected relations.
  3. **Node Customize** (`#customize`) — color picker `#customizecolor`, tagsinput `#tags`, Update button fires `customizeNode`.
  4. **Advance Actions** (`#advancedactions`) — `#changeparent` fstdropdown, `#linkNodes` fstdropdown (to link "far" nodes via `nodeUnit`), `#linkNodesInfo` table, `#sharelink` input + `#sharelinkbtn` Share button.

Modals (all Bootstrap 4, data-toggle="modal"):
- `#myModal` — Add/Edit Property (inputs `#Property`, `#Value`, `#Date`)
- `#myModal2` — Confirm Delete Node
- `#myModal3` — Add/Edit Edge (select `#Edge` of siblings, input `#EdgeValue`)
- `#myModal4` — Edit Node label (`#NodeName`)
- `#myModal5` — Bulk Add Nodes/Edges (tagsinput `#BulkNodes` → generates a row per comma-separated item in `#BulkNodesTable`)

### Global state — `graphExplorer.data`

Single mutable in-memory object, populated by `loadGraph` from `/api/Values/{UserSchemaId}` (or `localStorage['graphExplorer.data']` if `graphExplorer.isOffline`). Shape:

```js
graphExplorer.data = {
  nodes: [
    { id: 1, label: 'Node 1', parentId: <id|null>, color: '#97c2fc',
      tags: ['a','b'], nodeUnit: <uuid|null>, Properties: [{key,value,date}], shape: 'hexagon' },
    ...
  ],
  edges: [ { id: <uuid>, from: <id>, to: <id>, label: 'abc' } ],
  nodeUnits: [<uuid>, ...],
  selectedNode: <id|null>,   // currently selected (right panel focus)
  parentNode:   <id|null>,   // current drill-down context (the "cd" cursor)
  currentEdge:  <dom-ref|null>,
  currentProperty: <dom-ref|null>,
};
```

Key concepts:
- **`parentId`** — tree hierarchy; root nodes have none. Nodes with children auto-render as `shape: 'hexagon'`.
- **`parentNode`** — drill-down cursor. When set, only children of that node are rendered (unless Global toggle is on).
- **`nodeUnit`** (UUID) — groups "far" nodes that represent the same real-world entity across unrelated subtrees; used by the Link Far Nodes feature. All nodes with the same `nodeUnit` are treated as linked.
- **`Properties[]`** — per-node typed-ish key/value/date list; rendered in the Properties tab; URLs auto-linked via `utilities.validateURL`.

### Key modules

- **`Scripts/app.js`** — Boot, hash router, route event wiring, template loader, redirect/logout handlers. Defines `AppConfig`, `AppRoutes`.
- **`Scripts/eventbus.min.js`** — Tiny pub/sub (`EventBus.addEventListener` / `.removeEventListener` / `.dispatch`). **Same-named handlers stack** unless removed first — so every legacy handler pairs `removeEventListener(name); addEventListener(name, fn)` to stay idempotent across template re-injections.
- **`Scripts/signalrEventBus.js`** — Adapter that forwards `EventBus.dispatch` calls to the SignalR `messageBusHub` for cross-tab / multi-user propagation. `isNotExclusive` filters out `ui.web.*` events (UI-local only). **On .NET 9 the hub endpoint 404s at `/signalr/js` — all `*: unable to propagate` warnings come from here and are benign**; the local EventBus still works.
- **`Scripts/services.js`** — `services.client.dataservice.*` façade over `graphExplorer.data`:
  - `deselectCurrentNode/Property/Edge/ParentNode`, `getNode(id, nullable)`, `getCurrentNode`, `getCurrentSiblingNodes`
  - `createUpdateNode(label, id?, parentId?)` — append new or update label on existing
  - `createUpdateEdgeFromCurrentNode(nodeId, edgeDomRef?, edgeValue, oldEdgeJSON)` — create or update an edge against `selectedNode`
  - `isDataValid()` — sanity check for `graphExplorer.data`
- **`Scripts/graphExplorer.js`** — The **biggest legacy module** (~780 lines). Owns all graph events, vis.js lifecycle, save/load, history, and jQuery DOM bindings. See event map below.
- **`Scripts/utilities.js`** — `validateURL(str)` (regex) and `mergeDeep(a,b)`.
- **`Scripts/login.js`** — Auth events: `UI.Web.App.UI.Login`, `UI.Web.App.UI.CreateUser`, `UI.Web.App.UI.Login.LoadUserInfo` (GETs `/api/UserAuth/{UserId}` and renders schema list), `UI.Web.App.UI.Login.schemaSelect` (stashes `UserSchemaId` and redirects to `/Graph`), `UI.Web.App.UI.Login.schemaAdd` (POSTs `/api/UserSchema`).
- **`Scripts/tagsinput.js`** — Third-party Bootstrap 4 tags input widget used for `#tags` (node tags) and `#BulkNodes`.

### EventBus event catalog (legacy graph UI)

App-level (dot.cased, global):
- `UI.Web.App.UiChanged` — router trigger (re-render current hash).
- `UI.Web.App.Redirect` (payload `{target: '/path'}`) — set hash + re-render.
- `UI.Web.App.Logout` — clear session, go to `/Login`.
- `UI.Web.App.Route.Main` — graph page mounted. Dispatches `onGraphEnabled`.
- `UI.Web.App.Route.Login` — login page mounted (clears `sessionStorage`).
- `UI.Web.App.UI.Login`, `UI.Web.App.UI.CreateUser`, `UI.Web.App.UI.Login.LoadUserInfo`, `UI.Web.App.UI.Login.schemaSelect`, `UI.Web.App.UI.Login.schemaAdd` — login flow.

Graph-level (camelCase, local, in `graphExplorer.js`):
- `onGraphEnabled` — **one-time init**: validates session, sets `graphExplorer.url = /api/Values/{UserSchemaId}`, binds DOM listeners (datepicker, fstdropdown change handlers, share copy, neighbouring toggle, search inputs), fires `loadGraph`.
- `loadGraph` / `saveGraph` — GET/POST to `graphExplorer.url`. Save strips `selectedNode`/`currentEdge`/`currentProperty` before sending `{SchemaInfo:<json>, ModifiedBy:<UserId>}`. Save blocked when route params include a `key` and the `btoa(origin+path)` doesn't match (share-link tamper guard).
- `Undo` / `Redo` → `graphExplorer.ctx.History(mode)` → `PUT /api/Values/{UserSchemaId}?mode=undo|redo`.
- `graphUpdated` — **central re-render**. Filters nodes via `getCurrentNodes` (parentNode scope + searchmode + n-level neighbours), builds `vis.DataSet`, creates the `vis.Network` on first call or calls `network.setData`. Hashes inputs (`hashCode(JSON.stringify(data)+filters)`) to skip redundant redraws.
- `selectNode` / `deselectNode` — wired from `network.on('selectNode'|'deselectNode')`; update `selectedNode`, fire `refreshPanel`.
- `refreshPanel` — shows `#panel` if node selected else `#generalpanel`; fans out to `refreshPanelProps`, `refreshPanelGraphEditor`, `refreshPanelCustomize`, `refreshPanelAdvanceAction`.
- Node CRUD: `readNode` (open edit modal), `addNode` (save label), `removeNode`, `modifyNode`.
- Edge CRUD: `readEdge` (open modal with siblings), `addEdge`, `deleteEdge`.
- Property CRUD: `readPropperty` (sic — typo kept for bw-compat), `addPropperty`, `refreshPanelProps`.
- Drill-down: `openNode` (set `parentNode = selectedNode`, dispatch `graphUpdated`), `closeNode` (go up one level, respecting route-locked root).
- Bulk: `addNewNodesEdges` (open modal), `SubmitAddNewNodesEdges` (create all rows).
- Advanced: `changeparent` (reassign `parentId`, root nodes refused), `linkNode` (assign/merge `nodeUnit`), `redirectNode` (jump to any node), `deleteLinkNode` (clear `nodeUnit`), `customizeNode` (color + tags), `onlyNeighbourToggle`.

### vis.js integration

- Container: `document.getElementById('mynetwork')`.
- Two preset option sets in `graphExplorer.ctx.representationstyle`:
  - `.graph` — force-directed, `navigationButtons: true`, `keyboard: true`, `physics.stabilization.iterations: 10`.
  - `.hierarchical` — merged over `.graph`, adds `layout.hierarchical: { direction:'UD', nodeSpacing:150 }`, `edges.smooth: cubicBezier/vertical/roundness:1`, `interaction.dragNodes:false`, `physics:false`.
- Switched via `#representationstyle` select which fires `loadGraph` (full rebuild).
- Node coloring: `defaultNodeColor = '#97c2fc'`. Nodes that have children get `shape: 'hexagon'` applied inside `getCurrentNodes` before becoming a `vis.DataSet`.

### Share-link tamper check

Share link format: `{origin}/#/Graph/{UserSchemaId}/{NodeId}/{btoa(origin + '/#/Graph/{UserSchemaId}/{NodeId}')}`. Both `saveGraph` and `loadGraph` verify `window.btoa(location.href.substring(0, location.href.lastIndexOf('/')))` matches `routeParams.key` before hitting the API — prevents saving into someone else's shared link.

### Legacy frontend quirks & gotchas

- **`removeEventListener` before every `addEventListener`** — required because templates are re-injected on route change; without the remove, handlers would stack and fire N times.
- **Hash routing, not History API** — all navigation uses `window.location.hash`. Real URLs from the server only come into play for `/Home/template` and `/api/*`.
- **Typos frozen in contracts** — `readPropperty` / `addPropperty` (double-p). Do not "fix" without global audit; they are part of the event contract.
- **DOM refs used as state** — `graphExplorer.data.currentEdge` and `currentProperty` hold **live DOM elements**, not IDs. They are cleared on modal hide.
- **Heavy jQuery usage** — every DOM mutation is jQuery; `#myModal*` for modals uses Bootstrap 4 `.modal("show"|"hide")`.
- **`fstdropdown`** (custom fancy select) requires `.fstdropdown.rebind()` after `.html()` replaces options.
- **`localStorage` offline fallback** — if `graphExplorer.isOffline` is set (only when explicitly toggled), save/load goes to `localStorage['graphExplorer.data']` instead of the API.
- **SignalR generated proxy at `/signalr/js`** is requested from `index.html` but is not served by the .NET 9 backend — this is the source of the `404` and `unable to propagate` console warnings. **Benign** for local interactivity.

### What the new mockup (`mainpanels.tmp.html`, `MK.*`) replaces

The new self-contained mockup is a **separate prototype** built in the `window.MK` namespace. It re-implements every legacy feature (4 tabs, 11 modals, filters, drill-down, linking, share) with its own mock data, a custom SVG+div canvas (no vis.js), and dark theming. It is a non-wired visual mockup by default — it does not hit the real API.

**Legacy-mode overlay (real, wired):** the top-nav "Legacy" button calls `MK.setMode('legacy')`, which reveals a fixed overlay `#mk-legacy-ui` (nested inside `#mk-root`, so **never** hide `#mk-root` — ancestor `display:none` beats `position:fixed`; `MK.setMode` toggles the overlay only). On first activation, `loadLegacyUI()` does `$.ajax('/Home/template?Templatename=mainpanels.tmp1.html&_=<ts>')` and `$('#mk-lg-host').html(response)` — jQuery's html injection re-executes the inline `<script>` tags in order (`tagsinput.js` → `services.js` → `graphExplorer.js` → `bootstrap-select.min.js`). It then dispatches `EventBus.dispatch('onGraphEnabled')`, the same event `app.js` fires on the `/Graph` route, so `graphExplorer.js` runs its real session check → `loadGraph` → vis.js Network bootstrap against the real `/api/Values/{UserSchemaId}`. A `_legacyLoaded` flag makes the load one-time; subsequent toggles just show/hide the already-mounted DOM. The overlay's topbar has a `↻ Switch to New UI` button to flip back.

**`legacy-old` / `legacy-refined` canvas layouts** inside the mockup (different `.mk-canvas` rendering styles) **remain cosmetic only** — they are MK's own SVG canvas variants, not related to the real legacy UI. Do not import legacy scripts into `MK.*` code paths or vice-versa.

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
