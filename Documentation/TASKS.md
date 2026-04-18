# GraphKnowledgeManager — Full Task List

> Last updated: 2026-04-18  
> Sources: `todo` file, `MIGRATION.md`, `abc-graph-export-analysis.md`, vision analysis

---

## Phase 0 — Reliability / Blockers
> Must be done before anything else is trustworthy.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 1 | Fix export/import — validate JSON on save, strip blank leading lines, emit only if `JSON.parse` succeeds | abc analysis | 🔴 Critical |
| 2 | Hash passwords on registration and login (currently plaintext) | MIGRATION.md | 🔴 Critical |
| 3 | Remove hardcoded fallback user (`pheeca/1234`) in `UserAuthController.Post()` | MIGRATION.md | 🔴 Critical |
| 4 | Restrict CORS origins (currently `AllowAnyOrigin()`) | MIGRATION.md | 🔴 Critical |

---

## Phase 1 — Core Stability
> Foundational correctness before building features.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 5 | Add input validation on all API endpoints | MIGRATION.md | 🟠 High |
| 6 | Add FK constraint for `ModifiedBy` column in `SchemaInformation` | MIGRATION.md | 🟠 High |
| 7 | Fix back button behavior on deep node navigation | todo | 🟠 High |
| 8 | De-select node before saving, reselect after (state consistency) | todo | 🟠 High |
| 9 | Validation on user and graph creation forms (frontend) | todo | 🟠 High |
| 10 | Prevent save/undo/redo from setting all rows to `InActive` | todo | 🟠 High |
| 11 | Property key normalization — clean empty keys, normalize `URL` vs `url` | abc analysis | 🟠 High |

---

## Phase 2 — Schema & Data Model
> Typed, structured data — prerequisite for agent/automation work.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 12 | Rich property types: bool / checklist / numeric / currency / enum / time / time-range / geography / geometry / image / GUID / hierarchyId / file / external system IDs | todo | 🟡 Medium |
| 13 | Enum definition at graph or node level | todo | 🟡 Medium |
| 14 | Property sequencing — drag/drop ordering within a node | todo | 🟡 Medium |
| 15 | Tags with value: `tag name + value` pair (not just a label string) | todo | 🟡 Medium |
| 16 | Tag type classification | todo | 🟡 Medium |
| 17 | Search all nodes by tag | todo | 🟡 Medium |
| 18 | Node type — class-like typing for nodes (e.g. Person, Project, Place) | todo | 🟡 Medium |

---

## Phase 3 — UI / UX
> Make the canvas usable at scale.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 19 | Searchable dropdown when adding a relation/edge | todo | 🟡 Medium |
| 20 | Display only related nodes on selected node (toggle filter) | todo | 🟡 Medium |
| 21 | Move node — change parent without deleting | todo | 🟡 Medium |
| 22 | Link far nodes as a single logical unit | todo | 🟡 Medium |
| 23 | Navigate to linked/neighbouring nodes (n-level depth control) | todo | 🟡 Medium |
| 24 | N-level neighbour UI fix (layout/rendering) | todo | 🟡 Medium |
| 25 | Create multiple nodes linked to current node in one action | todo | 🟡 Medium |
| 26 | Disconnect linked node (remove edge without deleting nodes) | todo | 🟡 Medium |
| 27 | Responsive layout (tablet / mobile viewport) | todo | 🟡 Medium |
| 28 | Change text color on dark background for readability | todo | 🟡 Medium |
| 29 | Prevent node/edge visual overlap (elbow-shaped edges, layout avoidance) | todo | 🟡 Medium |
| 30 | Node scale and title display options | todo | 🟡 Medium |
| 31 | Display current app version on screen (dynamic, from build) | todo | 🟡 Medium |
| 32 | Documentation link on site | todo | 🟡 Medium |

---

## Phase 4 — Graph Features
> Power-user graph operations.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 33 | Templates — define reusable node structures (child nodes, sibling nodes, color, properties, links, tags, hierarchy) | todo | 🟡 Medium |
| 34 | Default standard knowledge graph template per tenant | todo | 🟡 Medium |
| 35 | Client-side pipeline — CRUD nodes/properties/edges in structured sequence | todo | 🟡 Medium |
| 36 | Search node — clear search state on node select | todo | 🟡 Medium |
| 37 | N-dimensional tabular view of graph data | todo | 🔵 Low |
| 38 | Properties vs tasks — define whether actions should be modeled as properties | todo | 🔵 Low |
| 39 | Hierarchy view + property form layout | todo | 🔵 Low |
| 40 | Complex character / hyperlink embedding support in labels | todo | 🔵 Low |

---

## Phase 5 — Multi-user / Collaboration

| # | Task | Source | Priority |
|---|------|---------|----------|
| 41 | Full user registration flow (frontend + backend) | todo | 🟡 Medium |
| 42 | Multi-graph support (multiple graphs per user) | todo | 🟡 Medium |
| 43 | Share graph with another user | todo | 🟡 Medium |
| 44 | Graph share permissions (read / write / none per subgraph) | todo | 🟡 Medium |
| 45 | Concurrent user support — node and edge locking | todo | 🔵 Low |
| 46 | Multi-tenancy (isolated workspaces per organization) | todo | 🔵 Low |
| 47 | Admin user access to other users' graphs | todo | 🔵 Low |

---

## Phase 6 — Time & Workflow Engine
> Turns the graph from a memory store into an operating system.

| # | Task | Source | Priority |
|---|------|---------|----------|
| 48 | Time semantics on properties — due date, overdue flag, recently-changed query | vision gap | 🟡 Medium |
| 49 | Activity state machine enforcement: `Intended → Started → UnVerified → Completed` (queryable, not optional metadata) | todo + abc | 🟡 Medium |
| 50 | Scheduler — calendar/event integration | todo | 🔵 Low |
| 51 | Process declaration — define flows with absolute start/end, interval, delayed custom point | todo | 🔵 Low |
| 52 | Event + trigger engine: app / system / bot / 3rd-party / custom / scheduler / notification / inferencing event types | todo | 🔵 Low |
| 53 | Notification engine — mobile alarm, push notification, email | todo | 🔵 Low |
| 54 | Reporter sub-system | todo | 🔵 Low |
| 55 | Prioritizer sub-system | todo | 🔵 Low |
| 56 | Information manipulator — interface and non-interface conventions for viewing, searching, changing | todo | 🔵 Low |

---

## Phase 7 — Integrations & External Systems

| # | Task | Source | Priority |
|---|------|---------|----------|
| 57 | File attachment — integrate Backblaze B2 or MediaFire (no self-hosted storage) | todo | 🔵 Low |
| 58 | Contact import — bulk import, categorize, map to social media profiles, generate sub-graph | todo | 🔵 Low |
| 59 | Keep track of voice recordings, WhatsApp quotes, Gmail email references as node properties | todo | 🔵 Low |
| 60 | Mobile app conversion | todo | 🔵 Low |
| 61 | Console / Prolog integration for programmatic graph query | todo | 🔵 Low |
| 62 | 3rd party platform events — Facebook / WhatsApp / Twitter / news feeds as graph data pipelines | todo | 🔵 Low |
| 63 | Image-based ML node matching (identify/match person node by photo) | todo | 🔵 Low |

---

## Phase 8 — Technical Debt / Infrastructure

| # | Task | Source | Priority |
|---|------|---------|----------|
| 64 | EventBus / SignalR — decide: port to .NET 9 SignalR Hub or redesign with SSE/WebSocket | MIGRATION.md | 🔵 Low |
| 65 | Sub-system event namespacing: `UI.Web.XX`, `Server.Web.XX`, `APP.XX` | todo | 🔵 Low |
| 66 | Dynamic event placement engine | todo | 🔵 Low |
| 67 | Performance optimization — large graph rendering, pagination, lazy load | todo | 🔵 Low |

---

## Summary

| Phase | Count | Blockers |
|-------|-------|----------|
| 0 — Reliability | 4 | Yes — nothing is safe to ship without these |
| 1 — Stability | 7 | Yes — core correctness |
| 2 — Schema | 7 | Prerequisite for automation |
| 3 — UI/UX | 14 | Usability at scale |
| 4 — Graph Features | 8 | Power user |
| 5 — Collaboration | 7 | Multi-user |
| 6 — Workflow Engine | 9 | OS vision |
| 7 — Integrations | 7 | Ecosystem |
| 8 — Tech Debt | 4 | Infrastructure |
| **Total** | **67** | |
