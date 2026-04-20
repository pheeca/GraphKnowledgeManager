using GK.DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("GraphKnowledge")
    ?? throw new InvalidOperationException("ConnectionStrings:GraphKnowledge not configured. Run setup-dev script or set via environment variable.");

builder.Services.AddSingleton<IDbConnectionFactory>(new SqlConnectionFactory(connectionString));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserSchemaRepository, UserSchemaRepository>();
builder.Services.AddScoped<ISchemaInformationRepository, SchemaInformationRepository>();
builder.Services.AddScoped<ISchemaShareRepository, SchemaShareRepository>();

builder.Services.AddControllers(o =>
    {
        o.Filters.Add(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(60 * 1024 * 1024));
    })
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null);

// 60 MB JSON body limit
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.ValueLengthLimit = 60 * 1024 * 1024;
    o.MultipartBodyLengthLimit = 60 * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.MaxRequestBodySize = 60 * 1024 * 1024;
    k.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(6);
    k.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(6);
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MyCorsPolicy",
        policy =>
        {
            policy.WithOrigins() // Equivalent to WithOrigins("*")
                  .AllowAnyHeader() // Allow any headers
                  .AllowAnyMethod(); // Allow any HTTP methods
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("MyCorsPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();
