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
            if (ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.Active).Count()==0)
            {
                var info =ctx.SchemaInformations.Where(f => f.UserSchemaId == id)
                      .OrderByDescending(p => p.CreationDate).FirstOrDefault();
                if (info!=null)
                {
                    info.Status = Constants.Active;
                    ctx.SaveChanges();
                }
            }
            return ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.Active)
                      .OrderByDescending(p => p.CreationDate)
                      .FirstOrDefault()?.SchemaInfo;
        }

        // POST api/values
        public bool Post(int id, [FromBody] SchemaStore value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                var schemaInfo = ctx.SchemaInformations.Add(new DataAccess.SchemaInformation
                {
                    UserSchemaId = id,
                    SchemaInfo = value.SchemaInfo,
                    CreationDate = DateTime.UtcNow,
                    ModifiedBy = value.ModifiedBy,
                    Status = Constants.Active
                });
                var schemaInfoChanges = ctx.SaveChanges();
                var informations = ctx.SchemaInformations
                    .Where(f => f.UserSchemaId == id && f.Status == Constants.Active && schemaInfo.Id != f.Id).ToList();
                foreach (var information in informations)
                {
                    information.Status = Constants.InActive;
                }
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
        public string Put(int id, string mode, [FromBody] SchemaStore value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                if (mode?.ToLowerInvariant() == "undo")
                {
                    var SchemaInformationFrom = ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.Active)
                          .OrderByDescending(p => p.CreationDate)
                          .FirstOrDefault();
                    var SchemaInformationTo = ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.InActive
                    && f.Id < SchemaInformationFrom.Id)
                          .OrderByDescending(p => p.CreationDate)
                          .FirstOrDefault();
                    if (SchemaInformationFrom==null || SchemaInformationTo==null)
                    {
                        return "Data Missing";
                    }
                    SchemaInformationFrom.Status = Constants.InActive;
                    SchemaInformationTo.Status = Constants.Active;
                    ctx.SaveChanges();
                    return SchemaInformationTo.SchemaInfo;
                }
                else if (mode?.ToLowerInvariant() == "redo")
                {

                    var SchemaInformationFrom = ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.Active)
                          .OrderByDescending(p => p.CreationDate)
                          .FirstOrDefault();

                    var SchemaInformationTo = ctx.SchemaInformations.Where(f => f.UserSchemaId == id && f.Status == Constants.InActive
                    && f.Id > SchemaInformationFrom.Id).OrderBy(p => p.CreationDate)
                          .FirstOrDefault();

                    if (SchemaInformationFrom == null || SchemaInformationTo == null)
                    {
                        return "Data Missing";
                    }
                    SchemaInformationFrom.Status = Constants.InActive;
                    SchemaInformationTo.Status = Constants.Active;
                    ctx.SaveChanges();
                    return SchemaInformationTo.SchemaInfo;
                }
            }
            catch (Exception e)
            {
                return e.Message;
            }
            return string.Empty;
        }

        // DELETE api/values/5
        public void Delete(int id)
        {
        }
    }
}
