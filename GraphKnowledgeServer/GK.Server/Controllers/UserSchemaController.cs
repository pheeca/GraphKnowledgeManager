using GK.DataAccess;
using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserSchemaController : ControllerBase
{
    private readonly IUserSchemaRepository _repo;

    public UserSchemaController(IUserSchemaRepository repo) => _repo = repo;

    // GET api/userschema/5
    [HttpGet("{id}")]
    public List<UserSchema> Get(int id)
    {
        return _repo.GetByOwner(id);
    }

    // POST api/userschema
    [HttpPost]
    public bool Post([FromForm] UserSchema value)
    {
        return _repo.Create(value);
    }
}
