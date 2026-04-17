using Microsoft.AspNetCore.Mvc;

namespace GK.Server.Controllers;

[Route("[controller]")]
public class HomeController : Controller
{
    private readonly IWebHostEnvironment _env;

    public HomeController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet("template")]
    public string Template([FromQuery] string templateName)
    {
        var filePath = Path.Combine(_env.WebRootPath, "Templates", templateName);
        if (!System.IO.File.Exists(filePath))
        {
            return "<p id='appcontainer'> Template not found</p>";
        }
        return System.IO.File.ReadAllText(filePath);
    }
}
