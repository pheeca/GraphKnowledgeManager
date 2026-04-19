using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShareController : ControllerBase
{
    private readonly ISchemaShareRepository _shareRepo;

    public ShareController(ISchemaShareRepository shareRepo) => _shareRepo = shareRepo;

    // POST /api/share — create a share link (owner only)
    [HttpPost]
    public IActionResult Create([FromForm] CreateShareRequest req)
    {
        if (req.UserSchemaId <= 0 || req.RootNodeId <= 0 || req.CreatedBy <= 0)
            return BadRequest("UserSchemaId, RootNodeId, and CreatedBy are required.");

        if (req.AccessMode != "ReadOnly" && req.AccessMode != "ReadWrite")
            return BadRequest("AccessMode must be 'ReadOnly' or 'ReadWrite'.");

        var shareId = _shareRepo.Create(req.UserSchemaId, req.RootNodeId, req.AccessMode, req.CreatedBy, req.ExpiresAt);
        return Ok(shareId.ToString());
    }

    // GET /api/share/{shareId} — load filtered subtree graph
    [HttpGet("{shareId:guid}")]
    public IActionResult Get(Guid shareId)
    {
        var data = _shareRepo.GetShareData(shareId);
        if (data == null) return NotFound("Share link is invalid or has expired.");
        return Ok(data);
    }

    // POST /api/share/{shareId} — save subtree changes (ReadWrite shares only)
    [HttpPost("{shareId:guid}")]
    public IActionResult Save(Guid shareId, [FromForm] ShareSaveRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.SchemaInfo))
            return BadRequest("SchemaInfo is required.");

        var result = _shareRepo.SaveSubtree(shareId, req.SchemaInfo, req.ModifiedBy);
        if (!result) return Forbid();
        return Ok(true);
    }

    // DELETE /api/share/{shareId}?requestingUserId=n — revoke (owner only)
    [HttpDelete("{shareId:guid}")]
    public IActionResult Revoke(Guid shareId, [FromQuery] int requestingUserId)
    {
        if (requestingUserId <= 0) return BadRequest("requestingUserId is required.");
        var result = _shareRepo.Revoke(shareId, requestingUserId);
        if (!result) return Forbid();
        return Ok(true);
    }
}
