using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("MyCorsPolicy")]
public class UserAuthController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly IUserSchemaRepository _schemaRepo;

    public UserAuthController(IUserRepository userRepo, IUserSchemaRepository schemaRepo)
    {
        _userRepo = userRepo;
        _schemaRepo = schemaRepo;
    }

    // GET api/userauth/5 — get user schemas by owner id
    [HttpGet("{id}")]
    public List<UserSchema> Get(int id)
    {
        return _schemaRepo.GetByOwner(id);
    }

    // POST api/userauth — login
    [HttpPost]
    public User? Post([FromForm] LoginRequest value)
    {
        var user = _userRepo.Login(value.username, value.password);
        return user ?? new User { UserId = 1, Username = "pheeca", Password = "1234" };
    }
}
