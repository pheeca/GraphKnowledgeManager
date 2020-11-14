using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Http.Cors;
using System.Web.Mvc;

namespace GraphKnowledgeServer.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Title = "Home Page";

            return View();
        }

        public string Template(string TemplateName)
        {
            ViewBag.Title = "Home Page";
            var filePath = Path.Combine(Server.MapPath("~/"), "Templates", TemplateName);
            var file = string.Empty;
            if (!System.IO.File.Exists(filePath))
            {
                file = "<p id='appcontainer'> Template not found</p>";
            }
            else
            {
                file = System.IO.File.ReadAllText(filePath);
            }
            //byte[] bytes = Encoding.Default.GetBytes(file);
            //file = Encoding.UTF8.GetString(bytes);
            return file;
        }
        public ActionResult MyHtmlView()
        {
            return Content("<html><body>Ahoy.</body></html>", "text/html");
        }
    }
}
