using GraphKnowledgeServer.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;

namespace GraphKnowledgeServer.Controllers
{
    //[EnableCors(origins: "*", headers: "*", methods: "*")]
    public class ValuesController : ApiController
    {
        // GET api/values
        public string Get()
        {
            var ctx = new DataAccess.GraphKnowledgeEntities();
            return ctx.SchemaInformations
                      .OrderByDescending(p => p.CreationDate)
                      .FirstOrDefault()?.SchemaInfo;
        }

        // GET api/values/5
        public string Get(int id)
        {
            var ctx = new DataAccess.GraphKnowledgeEntities();
            return ctx.SchemaInformations.Where(f => f.UserSchemaId == id)
                      .OrderByDescending(p => p.CreationDate)
                      .FirstOrDefault()?.SchemaInfo;
        }

        // POST api/values
        public bool Post(int id,[FromBody] SchemaStore value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                ctx.SchemaInformations.Add(new DataAccess.SchemaInformation
                {
                    UserSchemaId = id,
                    SchemaInfo = value.SchemaInfo,
                    CreationDate = DateTime.UtcNow,
                    ModifiedBy = value.ModifiedBy,
                    Status = Constants.Active
                });
                ctx.SaveChanges();
                //if (!File.Exists(System.Web.HttpContext.Current.Server.MapPath($"~/Content/graph{DateTime.Now.ToString("yyyyMMdd")}.json")))
                //{
                //    File.WriteAllText(System.Web.HttpContext.Current.Server.MapPath($"~/Content/graph{DateTime.Now.ToString("yyyyMMdd")}.json"), File.ReadAllText(System.Web.HttpContext.Current.Server.MapPath("~/Content/graph.json")));
                //}
                //File.WriteAllText(System.Web.HttpContext.Current.Server.MapPath("~/Content/graph.json"), value);
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
