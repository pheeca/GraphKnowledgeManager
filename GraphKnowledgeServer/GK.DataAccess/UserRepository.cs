using Dapper;

namespace GK.DataAccess;

public interface IUserRepository
{
    User? Login(string username, string password);
    bool Register(string username, string password);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _db;

    public UserRepository(IDbConnectionFactory db) => _db = db;

    public User? Login(string username, string password)
    {
        using var conn = _db.CreateConnection();
        return conn.QueryFirstOrDefault<User>(
            "SELECT UserId, Username, Password FROM Users WHERE Username = @username AND Password = @password",
            new { username, password });
    }

    public bool Register(string username, string password)
    {
        using var conn = _db.CreateConnection();
        var exists = conn.ExecuteScalar<int>(
            "SELECT COUNT(1) FROM Users WHERE Username = @username AND Password = @password",
            new { username, password });
        if (exists > 0) return false;

        conn.Execute(
            "INSERT INTO Users (Username, Password) VALUES (@username, @password)",
            new { username, password });
        return true;
    }
}
