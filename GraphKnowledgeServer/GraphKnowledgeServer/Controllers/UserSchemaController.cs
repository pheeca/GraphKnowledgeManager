using DataAccess;
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
    public class UserSchemaController : ApiController
    {
        // GET api/values
        //public string Get()
        //{
        //    var ctx = new DataAccess.GraphKnowledgeEntities();
        //    return ctx.UserSchemas
        //              .FirstOrDefault()?.SchemaInfo;
        //}

        // GET api/values/5
        public List<UserSchema> Get(int id)
        {
            var ctx = new DataAccess.GraphKnowledgeEntities();
            return ctx.UserSchemas.Where(f => f.OwnerUserId == id).ToList();
        }

        // POST api/values
        public bool Post([FromBody] DataAccess.UserSchema value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                var model =ctx.UserSchemas.Add(new DataAccess.UserSchema
                {
                     OwnerUserId= value.OwnerUserId,
                     SchemaName= value.SchemaName,
                      SchemaDesc= value.SchemaDesc
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
