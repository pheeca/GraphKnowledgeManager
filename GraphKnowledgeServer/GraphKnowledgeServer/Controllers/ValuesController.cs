using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace GraphKnowledgeServer.Controllers
{
    public class ValuesController : ApiController
    {
        // GET api/values
        public string Get()
        {
            return File.ReadAllText(System.Web.HttpContext.Current.Server.MapPath("~/Content/graph.json"));
        }

        // GET api/values/5
        public string Get(int id)
        {
            return "value";
        }

        // POST api/values
        public bool Post([FromBody]string value)
        {
            try
            {
                File.WriteAllText(System.Web.HttpContext.Current.Server.MapPath("~/Content/graph.json"), value);
                return true;
            }
            catch (Exception e)
            {
            }
            return false;
        }

        // PUT api/values/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        public void Delete(int id)
        {
        }
    }
}
