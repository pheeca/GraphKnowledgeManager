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
    public class UserAuthController : ApiController
    {
        //// GET api/values
        //public string Get()
        //{
        //    var ctx = new DataAccess.GraphKnowledgeEntities();
        //    return ctx.SchemaInformations
        //              .OrderByDescending(p => p.CreationDate)
        //              .FirstOrDefault()?.SchemaInfo;
        //}

        // GET api/values/5 getuserschemas by userid
        public List<DataAccess.UserSchema> Get(int id)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                ctx.Configuration.ProxyCreationEnabled = false;
                var userSchemas = ctx.UserSchemas.Where(e => e.OwnerUserId==id).ToList();
                return userSchemas;
            }
            catch (Exception e)
            {
            }
            return new List<DataAccess.UserSchema>();
        }

        // POST api/values
        public DataAccess.User Post([FromBody] User value)
        {
            try
            {
                var ctx = new DataAccess.GraphKnowledgeEntities();
                ctx.Configuration.ProxyCreationEnabled = false;
                var user = ctx.Users.FirstOrDefault(e => e.Username == value.username && e.Password == value.password);
                return user;
            }
            catch (Exception e)
            {
            }
            return null;
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
