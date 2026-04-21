using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GK.DataAccess
{
    using System;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Collections.Generic;

    public  class SchemaInformation
    {
        public long Id { get; set; }
        public string SchemaInfo { get; set; }
        public Nullable<System.DateTime> CreationDate { get; set; }
        public int UserSchemaId { get; set; }
        public Nullable<int> ModifiedBy { get; set; }
        public string Status { get; set; }

        [NotMapped]
        public virtual UserSchema UserSchema { get; set; }
    }
}
