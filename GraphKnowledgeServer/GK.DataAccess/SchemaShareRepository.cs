using Dapper;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace GK.DataAccess;

public interface ISchemaShareRepository
{
    Guid Create(int userSchemaId, int rootNodeId, string accessMode, int createdBy, DateTime? expiresAt);
    ShareData? GetShareData(Guid shareId);
    bool SaveSubtree(Guid shareId, string partialJson, int modifiedBy);
    bool Revoke(Guid shareId, int requestingUserId);
}

public class SchemaShareRepository : ISchemaShareRepository
{
    private readonly IDbConnectionFactory _db;
    private readonly ISchemaInformationRepository _schemaRepo;

    public SchemaShareRepository(IDbConnectionFactory db, ISchemaInformationRepository schemaRepo)
    {
        _db = db;
        _schemaRepo = schemaRepo;
    }

    public Guid Create(int userSchemaId, int rootNodeId, string accessMode, int createdBy, DateTime? expiresAt)
    {
        var shareId = Guid.NewGuid();
        using var conn = _db.CreateConnection();
        conn.Execute(
            @"INSERT INTO SchemaShare (ShareId, UserSchemaId, RootNodeId, AccessMode, CreatedBy, CreatedAt, ExpiresAt, IsRevoked)
              VALUES (@shareId, @userSchemaId, @rootNodeId, @accessMode, @createdBy, @createdAt, @expiresAt, 0)",
            new { shareId, userSchemaId, rootNodeId, accessMode, createdBy, createdAt = DateTime.UtcNow, expiresAt });
        return shareId;
    }

    public ShareData? GetShareData(Guid shareId)
    {
        using var conn = _db.CreateConnection();
        var share = conn.QueryFirstOrDefault<SchemaShare>(
            "SELECT * FROM SchemaShare WHERE ShareId = @shareId AND IsRevoked = 0",
            new { shareId });

        if (share == null) return null;
        if (share.ExpiresAt.HasValue && share.ExpiresAt.Value < DateTime.UtcNow) return null;

        var schemaInfo = _schemaRepo.GetActiveBySchemaId(share.UserSchemaId);
        if (schemaInfo == null) return null;

        var filtered = FilterToSubtree(schemaInfo, share.RootNodeId);
        return new ShareData { AccessMode = share.AccessMode, SchemaInfo = filtered };
    }

    public bool SaveSubtree(Guid shareId, string partialJson, int modifiedBy)
    {
        using var conn = _db.CreateConnection();
        var share = conn.QueryFirstOrDefault<SchemaShare>(
            "SELECT * FROM SchemaShare WHERE ShareId = @shareId AND IsRevoked = 0",
            new { shareId });

        if (share == null) return false;
        if (share.AccessMode != "ReadWrite") return false;
        if (share.ExpiresAt.HasValue && share.ExpiresAt.Value < DateTime.UtcNow) return false;

        var fullJson = _schemaRepo.GetActiveBySchemaId(share.UserSchemaId);
        if (fullJson == null) return false;

        var merged = MergeSubtree(fullJson, partialJson, share.RootNodeId);
        if (merged == null) return false;

        return _schemaRepo.Create(share.UserSchemaId, merged, modifiedBy) > 0;
    }

    public bool Revoke(Guid shareId, int requestingUserId)
    {
        using var conn = _db.CreateConnection();
        var affected = conn.Execute(
            "UPDATE SchemaShare SET IsRevoked = 1 WHERE ShareId = @shareId AND CreatedBy = @requestingUserId",
            new { shareId, requestingUserId });
        return affected > 0;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static HashSet<int> GetDescendantIds(JsonArray nodes, int rootNodeId)
    {
        var allowed = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(rootNodeId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!allowed.Add(current)) continue;

            foreach (var nodeObj in nodes)
            {
                if (nodeObj is not JsonObject n) continue;
                var parentIdNode = n["parentId"];
                if (parentIdNode == null || parentIdNode.GetValueKind() == JsonValueKind.Null) continue;
                if (parentIdNode.GetValue<int>() == current)
                {
                    var childId = n["id"]?.GetValue<int>();
                    if (childId.HasValue) queue.Enqueue(childId.Value);
                }
            }
        }
        return allowed;
    }

    private static string FilterToSubtree(string schemaInfoJson, int rootNodeId)
    {
        var doc = JsonNode.Parse(schemaInfoJson)!.AsObject();
        var nodes = doc["nodes"]?.AsArray() ?? new JsonArray();
        var edges = doc["edges"]?.AsArray() ?? new JsonArray();

        var allowed = GetDescendantIds(nodes, rootNodeId);

        var filteredNodes = new JsonArray();
        foreach (var n in nodes)
        {
            if (n is JsonObject nObj && allowed.Contains(nObj["id"]?.GetValue<int>() ?? -1))
                filteredNodes.Add(JsonNode.Parse(nObj.ToJsonString()));
        }

        var filteredEdges = new JsonArray();
        foreach (var e in edges)
        {
            if (e is JsonObject eObj)
            {
                var from = eObj["from"]?.GetValue<int>() ?? -1;
                var to = eObj["to"]?.GetValue<int>() ?? -1;
                if (allowed.Contains(from) && allowed.Contains(to))
                    filteredEdges.Add(JsonNode.Parse(eObj.ToJsonString()));
            }
        }

        var result = new JsonObject
        {
            ["nodes"] = filteredNodes,
            ["edges"] = filteredEdges,
            ["nodeUnits"] = doc["nodeUnits"]?.DeepClone(),
            ["selectedNode"] = null,
            ["parentNode"] = rootNodeId,
            ["currentEdge"] = null,
            ["currentProperty"] = null
        };
        return result.ToJsonString();
    }

    private static string? MergeSubtree(string fullJson, string partialJson, int rootNodeId)
    {
        var full = JsonNode.Parse(fullJson)!.AsObject();
        var partial = JsonNode.Parse(partialJson)!.AsObject();

        var fullNodes = full["nodes"]?.AsArray() ?? new JsonArray();
        var partialNodes = partial["nodes"]?.AsArray() ?? new JsonArray();
        var partialEdges = partial["edges"]?.AsArray() ?? new JsonArray();

        var allowed = GetDescendantIds(fullNodes, rootNodeId);

        // Validate: reject if any submitted node is outside the allowed subtree
        foreach (var n in partialNodes)
        {
            if (n is JsonObject nObj)
            {
                var id = nObj["id"]?.GetValue<int>() ?? -1;
                // New nodes (not in full schema) must have parentId within allowed
                bool existedInFull = fullNodes.Any(fn => fn is JsonObject fnObj && fnObj["id"]?.GetValue<int>() == id);
                if (!existedInFull)
                {
                    var parentId = nObj["parentId"]?.GetValue<int?>();
                    if (parentId == null || !allowed.Contains(parentId.Value)) return null;
                }
                else if (!allowed.Contains(id))
                {
                    return null; // Attempt to mutate node outside share scope
                }
            }
        }

        // Build submitted node map for fast lookup
        var submittedNodesMap = new Dictionary<int, JsonObject>();
        var submittedNodeIds = new HashSet<int>();
        foreach (var n in partialNodes)
        {
            if (n is JsonObject nObj)
            {
                var id = nObj["id"]?.GetValue<int>() ?? -1;
                submittedNodesMap[id] = nObj;
                submittedNodeIds.Add(id);
            }
        }

        // Rebuild nodes: keep nodes outside allowed set, replace inside-allowed with submitted version
        var mergedNodes = new JsonArray();
        var fullNodeIds = new HashSet<int>();
        foreach (var n in fullNodes)
        {
            if (n is JsonObject nObj)
            {
                var id = nObj["id"]?.GetValue<int>() ?? -1;
                fullNodeIds.Add(id);
                if (allowed.Contains(id))
                {
                    // Replace with submitted version if present; omit if deleted
                    if (submittedNodesMap.TryGetValue(id, out var submitted))
                        mergedNodes.Add(JsonNode.Parse(submitted.ToJsonString()));
                }
                else
                {
                    mergedNodes.Add(JsonNode.Parse(nObj.ToJsonString()));
                }
            }
        }

        // Append brand-new nodes from submitted (ids not in original full schema)
        foreach (var n in partialNodes)
        {
            if (n is JsonObject nObj)
            {
                var id = nObj["id"]?.GetValue<int>() ?? -1;
                if (!fullNodeIds.Contains(id))
                    mergedNodes.Add(JsonNode.Parse(nObj.ToJsonString()));
            }
        }

        // Rebuild edges: keep edges entirely outside allowed set, replace rest with submitted
        var fullEdges = full["edges"]?.AsArray() ?? new JsonArray();
        var mergedEdges = new JsonArray();
        foreach (var e in fullEdges)
        {
            if (e is JsonObject eObj)
            {
                var from = eObj["from"]?.GetValue<int>() ?? -1;
                var to = eObj["to"]?.GetValue<int>() ?? -1;
                if (!allowed.Contains(from) && !allowed.Contains(to))
                    mergedEdges.Add(JsonNode.Parse(eObj.ToJsonString()));
            }
        }
        foreach (var e in partialEdges)
        {
            if (e is JsonObject eObj)
                mergedEdges.Add(JsonNode.Parse(eObj.ToJsonString()));
        }

        full["nodes"] = mergedNodes;
        full["edges"] = mergedEdges;
        full["selectedNode"] = null;
        full["currentEdge"] = null;
        full["currentProperty"] = null;
        return full.ToJsonString();
    }
}
