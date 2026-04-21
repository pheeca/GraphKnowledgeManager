using Microsoft.Data.SqlClient;
using System.Data;

namespace GK.DataAccess;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

public class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public IDbConnection CreateConnection()
    {
        var builder = new SqlConnectionStringBuilder(_connectionString)
        {
            CommandTimeout = 300  // 5 minutes
        };
        return new SqlConnection(builder.ConnectionString);
    }
}
