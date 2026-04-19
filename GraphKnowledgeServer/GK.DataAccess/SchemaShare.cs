namespace GK.DataAccess;

public class SchemaShare
{
    public Guid ShareId { get; set; }
    public int UserSchemaId { get; set; }
    public int RootNodeId { get; set; }
    public string AccessMode { get; set; } = "ReadOnly";
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}

public class ShareData
{
    public string AccessMode { get; set; } = default!;
    public string SchemaInfo { get; set; } = default!;
}
