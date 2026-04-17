namespace GK.Server.Models;

public class LoginRequest
{
    public int id { get; set; }
    public string username { get; set; } = default!;
    public string password { get; set; } = default!;
}

public class SchemaStore
{
    public int UserSchemaId { get; set; }
    public string SchemaInfo { get; set; } = default!;
    public int ModifiedBy { get; set; }
}
