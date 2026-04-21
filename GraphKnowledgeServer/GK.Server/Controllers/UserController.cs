using GK.DataAccess;
using GK.Server.Models;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("MyCorsPolicy")]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepo;

    public UserController(IUserRepository userRepo) => _userRepo = userRepo;

    // POST api/user — register
    [HttpPost]
    public bool Post([FromForm] LoginRequest value)
    {
        return _userRepo.Register(value.username, value.password);
    }
}
