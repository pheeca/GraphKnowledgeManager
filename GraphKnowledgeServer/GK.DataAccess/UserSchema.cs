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

    public partial class UserSchema
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public UserSchema()
        {
            this.SchemaInformations = new HashSet<SchemaInformation>();
        }

        public int UserSchemaId { get; set; }
        public string SchemaName { get; set; }
        public string SchemaDesc { get; set; }
        public Nullable<int> OwnerUserId { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        [NotMapped]
        public virtual ICollection<SchemaInformation> SchemaInformations { get; set; }
        [NotMapped]
        public virtual User User { get; set; }
    }
}
