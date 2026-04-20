using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValuesController : ControllerBase
{
    private readonly ISchemaInformationRepository _repo;
    private readonly IWebHostEnvironment _env;

    public ValuesController(ISchemaInformationRepository repo, IWebHostEnvironment env)
    {
        _repo = repo;
        _env = env;
    }

    // GET api/values — latest schema info
    [HttpGet]
    public string? Get()
    {
        return _repo.GetLatest();
    }

    // GET api/values/5 — active schema for user schema id
    [HttpGet("{id}")]
    public string? Get(int id)
    {
        return _repo.GetActiveBySchemaId(id);
    }

    // POST api/values/5 — create schema version with server-side history generation
    [HttpPost("{id}")]
    public IActionResult Post(int id, [FromBody] SchemaStore value)
    {
        // 1. Capture previous active schema before saving
        var previousJson = _repo.GetActiveBySchemaId(id);
        var creationDate = DateTime.UtcNow;

        // 2. Insert the new schema version and get the new row Id
        var newSchemaInformationId = _repo.Create(id, value.SchemaInfo, value.ModifiedBy);
        if (newSchemaInformationId <= 0)
            return BadRequest("Failed to save schema.");

        // 3. Compute enriched schema with history entries for changed nodes
        try
        {
            var enriched = _enrichSchemaWithHistory(
                previousJson,
                value.SchemaInfo,
                newSchemaInformationId,
                value.ModifiedBy,
                creationDate);

            // 4. Write enriched schema back to the row we just inserted
            _repo.UpdateSchemaInfo(newSchemaInformationId, enriched);

            return Ok(enriched);
        }
        catch
        {
            // History stamping failed — schema was saved successfully, return original
            return Ok(value.SchemaInfo);
        }
    }

    private static string _enrichSchemaWithHistory(
        string? previousJson,
        string incomingJson,
        long newId,
        int modifiedBy,
        DateTime creationDate)
    {
        using var incomingDoc = JsonDocument.Parse(incomingJson);
        var incoming = incomingDoc.RootElement;

        // Build lookup of previous nodes (keyed by id) for diffing
        var prevNodes = new Dictionary<string, JsonElement>();
        if (!string.IsNullOrWhiteSpace(previousJson))
        {
            using var prevDoc = JsonDocument.Parse(previousJson);
            if (prevDoc.RootElement.TryGetProperty("nodes", out var prevNodesArr))
            {
                foreach (var pn in prevNodesArr.EnumerateArray())
                {
                    if (pn.TryGetProperty("id", out var idProp))
                        prevNodes[idProp.ToString()] = pn;
                }
            }
        }

        // Materialise incoming as a mutable structure
        var root = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(incomingJson)!;
        var newNodes = new List<Dictionary<string, object?>>();

        if (incoming.TryGetProperty("nodes", out var nodesArr))
        {
            foreach (var n in nodesArr.EnumerateArray())
            {
                var node = JsonSerializer.Deserialize<Dictionary<string, object?>>(n.GetRawText())!;
                var nodeId = n.TryGetProperty("id", out var idProp2) ? idProp2.ToString() : null;

                // Determine existing history list
                var history = new List<Dictionary<string, object?>>();
                if (n.TryGetProperty("history", out var histArr) && histArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var h in histArr.EnumerateArray())
                        history.Add(JsonSerializer.Deserialize<Dictionary<string, object?>>(h.GetRawText())!);
                }

                // Check if this node changed vs previous version (exclude history from comparison)
                if (nodeId != null && _nodeChanged(n, prevNodes.GetValueOrDefault(nodeId)))
                {
                    history.Add(new Dictionary<string, object?>
                    {
                        ["schemaInformationId"] = newId,
                        ["modifiedBy"] = modifiedBy,
                        ["creationDate"] = creationDate.ToString("o"),
                        ["action"] = prevNodes.ContainsKey(nodeId) ? "updated" : "created",
                        ["state"] = _nodeStateWithoutHistory(n)
                    });
                }

                node["history"] = history;
                newNodes.Add(node);
            }
        }

        // Build deletedNodeHistory for nodes in prev but not in incoming
        var incomingIds = new HashSet<string>(
            nodesArr.ValueKind == JsonValueKind.Array
                ? nodesArr.EnumerateArray()
                    .Where(n => n.TryGetProperty("id", out _))
                    .Select(n => n.GetProperty("id").ToString())
                : Enumerable.Empty<string>());

        // Carry over existing deletedNodeHistory and append new deletions
        var deletedHistory = new List<Dictionary<string, object?>>();
        if (incoming.TryGetProperty("deletedNodeHistory", out var existingDeleted) &&
            existingDeleted.ValueKind == JsonValueKind.Array)
        {
            foreach (var d in existingDeleted.EnumerateArray())
                deletedHistory.Add(JsonSerializer.Deserialize<Dictionary<string, object?>>(d.GetRawText())!);
        }

        foreach (var kv in prevNodes)
        {
            if (!incomingIds.Contains(kv.Key))
            {
                deletedHistory.Add(new Dictionary<string, object?>
                {
                    ["schemaInformationId"] = newId,
                    ["modifiedBy"] = modifiedBy,
                    ["creationDate"] = creationDate.ToString("o"),
                    ["action"] = "deleted",
                    ["state"] = _nodeStateWithoutHistory(kv.Value)
                });
            }
        }

        // Reconstruct final JSON
        var finalRoot = new Dictionary<string, object?>();
        foreach (var kv in root)
        {
            if (kv.Key == "nodes" || kv.Key == "deletedNodeHistory") continue;
            finalRoot[kv.Key] = kv.Value;
        }
        finalRoot["nodes"] = newNodes;
        finalRoot["deletedNodeHistory"] = deletedHistory;

        return JsonSerializer.Serialize(finalRoot);
    }

    private static bool _nodeChanged(JsonElement incoming, JsonElement prev)
    {
        if (prev.ValueKind == JsonValueKind.Undefined) return true; // new node
        return _nodeStateWithoutHistory(incoming) != _nodeStateWithoutHistory(prev);
    }

    private static string _nodeStateWithoutHistory(JsonElement node)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(node.GetRawText())!;
        dict.Remove("history");
        // Sort keys for stable comparison
        return JsonSerializer.Serialize(new SortedDictionary<string, JsonElement>(dict));
    }

    // PUT api/values/5?mode=undo|redo
    [HttpPut("{id}")]
    public string? Put(int id, [FromQuery] string mode)
    {
        return mode?.ToLowerInvariant() switch
        {
            "undo" => _repo.Undo(id) ?? "Data Missing",
            "redo" => _repo.Redo(id) ?? "Data Missing",
            _ => string.Empty
        };
    }

    // GET api/values/5/history — precomputed node history files for a schema
    [HttpGet("{id}/history")]
    public IActionResult GetHistory(int id)
    {
        var historyRoot = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "devutilities", "output", "nodeHistories"));
        var schemaFolder = Path.Combine(historyRoot, id.ToString());

        if (!Directory.Exists(schemaFolder))
        {
            return Ok(new Dictionary<string, object>());
        }

        var result = new Dictionary<string, object>();
        var files = Directory.GetFiles(schemaFolder, "*.json", SearchOption.TopDirectoryOnly);

        foreach (var file in files)
        {
            try
            {
                var nodeId = Path.GetFileNameWithoutExtension(file);
                var content = System.IO.File.ReadAllText(file);
                if (string.IsNullOrWhiteSpace(content))
                {
                    result[nodeId] = Array.Empty<object>();
                    continue;
                }

                using var doc = JsonDocument.Parse(content);
                result[nodeId] = doc.RootElement.Clone();
            }
            catch
            {
                // Skip malformed files and continue serving valid ones.
            }
        }

        return Ok(result);
    }
}
