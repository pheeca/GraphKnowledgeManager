using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace GraphKnowledgeServer.Models
{
    public class SchemaStore
    {
        public int UserSchemaId { get; set; }
        public string SchemaInfo { get; set; }
        public int ModifiedBy { get;  set; }
    }
}