using GraphKnowledgeServer.ViewModel;
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
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    public class UserController : ApiController
    {
        //// GET api/values
        //public string Get()
        //{
        //    var ctx = new DataAccess.GraphKnowledgeEntities();
        //    return ctx.SchemaInformations
        //              .OrderByDescending(p => p.CreationDate)
        //              .FirstOrDefault()?.SchemaInfo;
        //}

        //// GET api/values/5
        //public string Get(int id)
        //{
        //    return "value";
        //}

        // POST api/values
        public bool Post([FromBody] User value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                if (!ctx.Users.Any(e=>e.Username==value.username && e.Password==value.password))
                {

                    ctx.Users.Add(new DataAccess.User
                    {
                        Username = value.username,
                        Password = value.password
                    });
                    ctx.SaveChanges();
                    return true;
                }
                return false;
            }
            catch (Exception e)
            {
            }
            return false;
        }

        //// PUT api/values/5
        //public void Put(int id, [FromBody]string value)
        //{
        //}

        //// DELETE api/values/5
        //public void Delete(int id)
        //{
        //}
    }
}
