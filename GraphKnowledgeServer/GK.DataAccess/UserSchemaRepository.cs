using Dapper;

namespace GK.DataAccess;

public interface IUserSchemaRepository
{
    List<UserSchema> GetByOwner(int ownerUserId);
    bool Create(UserSchema schema);
}

public class UserSchemaRepository : IUserSchemaRepository
{
    private readonly IDbConnectionFactory _db;

    public UserSchemaRepository(IDbConnectionFactory db) => _db = db;

    public List<UserSchema> GetByOwner(int ownerUserId)
    {
        using var conn = _db.CreateConnection();
        return conn.Query<UserSchema>(
            "SELECT UserSchemaId, SchemaName, SchemaDesc, OwnerUserId FROM UserSchema WHERE OwnerUserId = @ownerUserId",
            new { ownerUserId }).ToList();
    }

    public bool Create(UserSchema schema)
    {
        using var conn = _db.CreateConnection();
        conn.Execute(
            "INSERT INTO UserSchema (OwnerUserId, SchemaName, SchemaDesc) VALUES (@OwnerUserId, @SchemaName, @SchemaDesc)",
            new { schema.OwnerUserId, schema.SchemaName, schema.SchemaDesc });
        return true;
    }
}
