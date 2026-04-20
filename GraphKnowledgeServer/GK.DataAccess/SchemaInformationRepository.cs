using Dapper;

namespace GK.DataAccess;

public interface ISchemaInformationRepository
{
    string? GetLatest();
    string? GetActiveBySchemaId(int userSchemaId);
    long Create(int userSchemaId, string schemaInfo, int modifiedBy);
    bool UpdateSchemaInfo(long id, string schemaInfo);
    string? Undo(int userSchemaId);
    string? Redo(int userSchemaId);
}

public class SchemaInformationRepository : ISchemaInformationRepository
{
    private readonly IDbConnectionFactory _db;

    public SchemaInformationRepository(IDbConnectionFactory db) => _db = db;

    public string? GetLatest()
    {
        using var conn = _db.CreateConnection();
        return conn.QueryFirstOrDefault<string>(
            "SELECT TOP 1 SchemaInfo FROM SchemaInformation ORDER BY CreationDate DESC");
    }

    public string? GetActiveBySchemaId(int userSchemaId)
    {
        using var conn = _db.CreateConnection();

        // Check if any active record exists
        var active = conn.QueryFirstOrDefault<string>(
            "SELECT SchemaInfo FROM SchemaInformation WHERE UserSchemaId = @userSchemaId AND Status = @Active ORDER BY CreationDate DESC",
            new { userSchemaId, Constants.Active });

        if (active != null) return active;

        // Auto-activate the latest record
        var latestId = conn.QueryFirstOrDefault<long?>(
            "SELECT TOP 1 Id FROM SchemaInformation WHERE UserSchemaId = @userSchemaId ORDER BY CreationDate DESC",
            new { userSchemaId });

        if (latestId == null) return null;

        conn.Execute(
            "UPDATE SchemaInformation SET Status = @Active WHERE Id = @latestId",
            new { Constants.Active, latestId });

        return conn.QueryFirstOrDefault<string>(
            "SELECT SchemaInfo FROM SchemaInformation WHERE Id = @latestId",
            new { latestId });
    }

    public long Create(int userSchemaId, string schemaInfo, int modifiedBy)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        var newId = conn.QuerySingle<long>(
            @"INSERT INTO SchemaInformation (UserSchemaId, SchemaInfo, CreationDate, ModifiedBy, Status)
              VALUES (@userSchemaId, @schemaInfo, @creationDate, @modifiedBy, @status);
              SELECT SCOPE_IDENTITY()",
            new { userSchemaId, schemaInfo, creationDate = DateTime.UtcNow, modifiedBy, status = Constants.Active },
            tx);

        conn.Execute(
            "UPDATE SchemaInformation SET Status = @InActive WHERE UserSchemaId = @userSchemaId AND Status = @Active AND Id != @newId",
            new { Constants.InActive, userSchemaId, Constants.Active, newId },
            tx);

        tx.Commit();
        return newId;
    }

    public bool UpdateSchemaInfo(long id, string schemaInfo)
    {
        using var conn = _db.CreateConnection();
        var affected = conn.Execute(
            "UPDATE SchemaInformation SET SchemaInfo = @schemaInfo WHERE Id = @id",
            new { schemaInfo, id });
        return affected > 0;
    }

    public string? Undo(int userSchemaId)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        var current = conn.QueryFirstOrDefault<SchemaInformation>(
            "SELECT TOP 1 Id, SchemaInfo FROM SchemaInformation WHERE UserSchemaId = @userSchemaId AND Status = @Active ORDER BY CreationDate DESC",
            new { userSchemaId, Constants.Active }, tx);

        if (current == null) return null;

        var previous = conn.QueryFirstOrDefault<SchemaInformation>(
            "SELECT TOP 1 Id, SchemaInfo FROM SchemaInformation WHERE UserSchemaId = @userSchemaId AND Status = @InActive AND Id < @currentId ORDER BY CreationDate DESC",
            new { userSchemaId, Constants.InActive, currentId = current.Id }, tx);

        if (previous == null) return null;

        conn.Execute("UPDATE SchemaInformation SET Status = @InActive WHERE Id = @Id", new { Constants.InActive, current.Id }, tx);
        conn.Execute("UPDATE SchemaInformation SET Status = @Active WHERE Id = @Id", new { Constants.Active, previous.Id }, tx);
        tx.Commit();

        return previous.SchemaInfo;
    }

    public string? Redo(int userSchemaId)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var tx = conn.BeginTransaction();

        var current = conn.QueryFirstOrDefault<SchemaInformation>(
            "SELECT TOP 1 Id, SchemaInfo FROM SchemaInformation WHERE UserSchemaId = @userSchemaId AND Status = @Active ORDER BY CreationDate DESC",
            new { userSchemaId, Constants.Active }, tx);

        if (current == null) return null;

        var next = conn.QueryFirstOrDefault<SchemaInformation>(
            "SELECT TOP 1 Id, SchemaInfo FROM SchemaInformation WHERE UserSchemaId = @userSchemaId AND Status = @InActive AND Id > @currentId ORDER BY CreationDate ASC",
            new { userSchemaId, Constants.InActive, currentId = current.Id }, tx);

        if (next == null) return null;

conn.Execute("UPDATE SchemaInformation SET Status = @InActive WHERE Id = @Id", new { Constants.InActive, current.Id }, tx);
        conn.Execute("UPDATE SchemaInformation SET Status = @Active WHERE Id = @Id", new { Constants.Active, next.Id }, tx);
        tx.Commit();

        return next.SchemaInfo;
    }
}
