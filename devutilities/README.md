# DevUtilities — GraphKnowledgeManager Development Tools

## generateNodeHistory.js

**Purpose:** Process all historical schema snapshots from the database and generate deduplicated node history files.

**Input:** SQL Server SchemaInformation table (all versions, not just active)

**Output:** `/devutilities/output/nodeHistories/{userSchemaId}/nodeId.json` — array of deduplicated history entries per node

### How It Works

1. Fetches all `SchemaInformation` rows chronologically (oldest first)
2. For each version, walks all nodes
3. **Deduplicates**: If current node state equals the last history entry (via JSON.stringify comparison), skip it
4. If changed, appends: `{ schemaInformationId, state, modifiedBy, creationDate }`
5. Writes organized output files

### Setup

```bash
cd devutilities
npm install
```

### Usage

**Option A: Via connection string argument**
```bash
node generateNodeHistory.js "Server=localhost;Database=GraphKnowledge;User Id=sa;Password=YourPassword"
```

**Option B: Via environment variables**
```bash
set DB_SERVER=localhost
set DB_NAME=GraphKnowledge
set DB_USER=sa
set DB_PASSWORD=YourPassword
node generateNodeHistory.js
```

**Option C: From .NET Core user-secrets (manual copy first)**
Get your connection string from:
```bash
cd ../GraphKnowledgeServer/GK.Server
dotnet user-secrets list
```
Then pass it to the script.

### Output Example

**File:** `output/nodeHistories/5/123.json`
```json
[
  {
    "schemaInformationId": 1,
    "state": {
      "id": 123,
      "label": "Node A",
      "parentId": null,
      "color": "#97c2fc",
      "tags": [],
      "Properties": []
    },
    "modifiedBy": "pheeca",
    "creationDate": "2025-01-15T10:30:00Z"
  },
  {
    "schemaInformationId": 3,
    "state": {
      "id": 123,
      "label": "Node A Updated",
      "parentId": null,
      "color": "#97c2fc",
      "tags": ["important"],
      "Properties": [...]
    },
    "modifiedBy": "pheeca",
    "creationDate": "2025-01-16T14:45:00Z"
  }
]
```

**Note:** Entry for `schemaInformationId: 2` is missing because the node state was identical to version 1.

### Next Steps

1. Once history files are generated, a new API endpoint will serve them: `GET /api/values/{userSchemaId}/history`
2. Frontend will add a History tab that displays deduplicated timeline per node
3. Later, a `log` property can be added to each entry explaining what changed

### Troubleshooting

- **"Error: connect ECONNREFUSED"** → Check DB_SERVER, ensure SQL Server is running
- **"Error: Login failed for user 'sa'"** → Verify credentials in user-secrets or env vars
- **"Invalid JSON in version"** → Corrupted SchemaInfo blob; script logs error and continues
