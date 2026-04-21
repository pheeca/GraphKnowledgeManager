using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValuesController : ControllerBase
{
    private readonly ISchemaInformationRepository _repo;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan _cacheTtl = TimeSpan.FromMinutes(60);
    // Tracks every key this controller puts into the shared IMemoryCache so we can flush them all.
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, byte> _trackedKeys = new();
    // Per-schema save lock: prevents concurrent saves and blocks GETs while save is in progress
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, SemaphoreSlim> _saveLocks = new();
    private static SemaphoreSlim _getLock(int id) => _saveLocks.GetOrAdd(id, _ => new SemaphoreSlim(1, 1));
    // Match legacy Newtonsoft.Json behavior: emit literal non-ASCII bytes (e.g. NBSP) instead of \uXXXX
    // escapes. Without this, every round-trip of existing data inflates non-ASCII chars ~6x.
    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static string _cacheKey(int id) => $"schema:{id}";

    private void _cacheSet(string key, string value)
    {
        _cache.Set(key, value, _cacheTtl);
        _trackedKeys.TryAdd(key, 0);
    }

    private void _cacheRemove(string key)
    {
        _cache.Remove(key);
        _trackedKeys.TryRemove(key, out _);
    }

    public ValuesController(ISchemaInformationRepository repo, IMemoryCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    // GET api/values — latest schema info
    [HttpGet]
    public string? Get()
    {
        return _repo.GetLatest();
    }

    // GET api/values/5 — active schema for user schema id
    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
        var sem = _getLock(id);
        if (sem.CurrentCount == 0)
            return StatusCode(423, "Schema is currently being saved. Please retry shortly.");

        if (_cache.TryGetValue(_cacheKey(id), out string? cached))
            return Ok(cached);

        var json = _repo.GetActiveBySchemaId(id);
        if (json != null)
            _cacheSet(_cacheKey(id), json);
        return Ok(json);
    }

    // POST api/values/5 — create schema version with server-side history generation
    [HttpPost("{id}")]
    public async Task<IActionResult> Post(int id, [FromBody] SchemaStore value)
    {
        var sem = _getLock(id);
        if (!await sem.WaitAsync(TimeSpan.Zero))
            return StatusCode(423, "A save is already in progress for this schema.");
        try
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
            _cacheSet(_cacheKey(id), enriched); // warm cache with enriched schema
            return Ok(enriched);
        }
        catch (Exception ex)
        {
            // History stamping failed — schema was saved successfully, return original
            Console.Error.WriteLine($"[ValuesController.Post] History enrichment failed for schemaId={id}: {ex}");
            _cacheRemove(_cacheKey(id)); // force fresh read on next GET
            return Ok(value.SchemaInfo);
        }
        } // end try
        finally
        {
            sem.Release();
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
        bool prevHasHistoryTracking = false; // true if at least one prev node already carries a history array
        if (!string.IsNullOrWhiteSpace(previousJson))
        {
            using var prevDoc = JsonDocument.Parse(previousJson);
            if (prevDoc.RootElement.TryGetProperty("nodes", out var prevNodesArr))
            {
                foreach (var pn in prevNodesArr.EnumerateArray())
                {
                    if (pn.TryGetProperty("id", out var idProp))
                        prevNodes[idProp.ToString()] = pn.Clone(); // Clone before doc is disposed
                    if (!prevHasHistoryTracking
                        && pn.TryGetProperty("history", out var h)
                        && h.ValueKind == JsonValueKind.Array)
                        prevHasHistoryTracking = true;
                }
            }
        }
        // First-time enrichment: the schema pre-dates history tracking.
        // Stamp every existing node with a "snapshot" entry so history is never empty after first save.
        bool isFirstEnrichment = prevNodes.Count > 0 && !prevHasHistoryTracking;

        // Materialise incoming as a mutable structure
        var root = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(incomingJson)!;
        var newNodes = new List<Dictionary<string, object?>>();

        if (incoming.TryGetProperty("nodes", out var nodesArr))
        {
            foreach (var n in nodesArr.EnumerateArray())
            {
                var node = JsonSerializer.Deserialize<Dictionary<string, object?>>(n.GetRawText())!;
                var nodeId = n.TryGetProperty("id", out var idProp2) ? idProp2.ToString() : null;

                // Determine existing history list — carry from PREVIOUS schema (not incoming payload)
                var history = new List<Dictionary<string, object?>>();
                if (nodeId != null && prevNodes.TryGetValue(nodeId, out var prevNode)
                    && prevNode.TryGetProperty("history", out var histArr)
                    && histArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var h in histArr.EnumerateArray())
                        history.Add(JsonSerializer.Deserialize<Dictionary<string, object?>>(h.GetRawText())!);
                }

                // Check if this node changed vs previous version (exclude history from comparison).
                // On first-time enrichment, always stamp a snapshot entry for every node.
                if (nodeId != null && (isFirstEnrichment || _nodeChanged(n, prevNodes.GetValueOrDefault(nodeId))))
                {
                    history.Add(new Dictionary<string, object?>
                    {
                        ["schemaInformationId"] = newId,
                        ["modifiedBy"] = modifiedBy,
                        ["creationDate"] = creationDate.ToString("o"),
                        ["action"] = isFirstEnrichment ? "snapshot" : (prevNodes.ContainsKey(nodeId) ? "updated" : "created"),
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

        // Carry over existing deletedNodeHistory from PREVIOUS schema (not incoming)
        var deletedHistory = new List<Dictionary<string, object?>>();
        if (!string.IsNullOrWhiteSpace(previousJson))
        {
            using var prevDocDel = JsonDocument.Parse(previousJson);
            if (prevDocDel.RootElement.TryGetProperty("deletedNodeHistory", out var existingDeleted)
                && existingDeleted.ValueKind == JsonValueKind.Array)
            {
                foreach (var d in existingDeleted.EnumerateArray())
                    deletedHistory.Add(JsonSerializer.Deserialize<Dictionary<string, object?>>(d.GetRawText())!);
            }
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

        return JsonSerializer.Serialize(finalRoot, _jsonOpts);
    }

    private static bool _nodeChanged(JsonElement incoming, JsonElement prev)
    {
        if (prev.ValueKind == JsonValueKind.Undefined) return true; // new node
        return _nodeStateWithoutHistory(incoming) != _nodeStateWithoutHistory(prev);
    }

    // Keys excluded from the state snapshot: history is stripped to avoid recursion;
    // Properties excluded because their size dominates and UUID-only churn would
    // cause every node to appear "changed" on every save after IDs are first assigned.
    private static readonly HashSet<string> _stateExcludedKeys = ["history"];

    private static string _nodeStateWithoutHistory(JsonElement node)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(node.GetRawText())!;
        foreach (var key in _stateExcludedKeys) dict.Remove(key);
        // Sort keys for stable comparison
        return JsonSerializer.Serialize(new SortedDictionary<string, JsonElement>(dict), _jsonOpts);
    }

    // PUT api/values/5?mode=undo|redo — returns { schema: trimmedJson, historyMap: { nodeId: [] } }
    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromQuery] string mode)
    {
        var raw = mode?.ToLowerInvariant() switch
        {
            "undo" => _repo.Undo(id),
            "redo" => _repo.Redo(id),
            _ => null
        };
        if (raw == null) return BadRequest("Invalid mode or no data.");

        // Warm the cache with the newly active full schema
        _cacheSet(_cacheKey(id), raw);

        return Ok(new
        {
            schema = _buildTrimmed(raw),
            historyMap = _buildHistoryMap(raw)
        });
    }

    // DELETE api/values/{id}/cache — flush cache for a single schema
    [HttpDelete("{id}/cache")]
    public IActionResult FlushSchemaCache(int id)
    {
        _cacheRemove(_cacheKey(id));
        return Ok(new { flushed = new[] { _cacheKey(id) } });
    }

    // DELETE api/values/cache — flush ALL schema caches held by this controller
    [HttpDelete("cache")]
    public IActionResult FlushAllCaches()
    {
        var keys = _trackedKeys.Keys.ToList();
        foreach (var key in keys)
            _cacheRemove(key);
        return Ok(new { flushed = keys, count = keys.Count });
    }

    // GET api/values/5/trimmed — active schema JSON with history[] stripped from all nodes (served from cache)
    [HttpGet("{id}/trimmed")]
    public IActionResult GetTrimmed(int id)
    {
        // Read from cache (populated by GET or POST); fall back to DB
        if (!_cache.TryGetValue(_cacheKey(id), out string? raw))
            raw = _repo.GetActiveBySchemaId(id);

        if (string.IsNullOrWhiteSpace(raw))
            return NotFound();

        return Ok(_buildTrimmed(raw));
    }

    // GET api/values/5/history-map — lightweight { nodeId: [historyEntries] } extracted from cached full schema
    [HttpGet("{id}/history-map")]
    public IActionResult GetHistoryMap(int id)
    {
        if (!_cache.TryGetValue(_cacheKey(id), out string? raw))
        {
            raw = _repo.GetActiveBySchemaId(id);
            if (raw != null) _cacheSet(_cacheKey(id), raw);
        }
        if (string.IsNullOrWhiteSpace(raw))
            return NotFound();

        return Ok(_buildHistoryMap(raw));
    }

    private static Dictionary<string, object?> _buildTrimmed(string schemaJson)
    {
        using var doc = JsonDocument.Parse(schemaJson);
        var root = doc.RootElement;
        var result = new Dictionary<string, object?>();
        foreach (var prop in root.EnumerateObject())
        {
            if (prop.Name == "nodes" && prop.Value.ValueKind == JsonValueKind.Array)
            {
                var nodes = new List<Dictionary<string, object?>>();
                foreach (var n in prop.Value.EnumerateArray())
                {
                    var node = new Dictionary<string, object?>();
                    foreach (var p in n.EnumerateObject())
                    {
                        if (p.Name == "history") continue;
                        node[p.Name] = p.Value.Clone();
                    }
                    nodes.Add(node);
                }
                result["nodes"] = nodes;
            }
            else if (prop.Name == "deletedNodeHistory")
            {
                continue; // exclude from trimmed payload
            }
            else
            {
                result[prop.Name] = prop.Value.Clone();
            }
        }
        return result;
    }

    private static Dictionary<string, List<JsonElement>> _buildHistoryMap(string schemaJson)
    {
        using var doc = JsonDocument.Parse(schemaJson);
        var map = new Dictionary<string, List<JsonElement>>();
        if (!doc.RootElement.TryGetProperty("nodes", out var nodesArr)) return map;
        foreach (var n in nodesArr.EnumerateArray())
        {
            if (!n.TryGetProperty("id", out var idProp)) continue;
            var nodeId = idProp.ToString();
            var entries = new List<JsonElement>();
            if (n.TryGetProperty("history", out var hist) && hist.ValueKind == JsonValueKind.Array)
                foreach (var h in hist.EnumerateArray())
                    entries.Add(h.Clone());
            if (entries.Count > 0)
                map[nodeId] = entries;
        }
        return map;
    }

}
