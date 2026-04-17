using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValuesController : ControllerBase
{
    private readonly ISchemaInformationRepository _repo;

    public ValuesController(ISchemaInformationRepository repo) => _repo = repo;

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

    // POST api/values/5 — create schema version
    [HttpPost("{id}")]
    public bool Post(int id, [FromForm] SchemaStore value)
    {
        return _repo.Create(id, value.SchemaInfo, value.ModifiedBy);
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
}
