using GK.DataAccess;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("GraphKnowledge")
    ?? throw new InvalidOperationException("ConnectionStrings:GraphKnowledge not configured. Run setup-dev script or set via environment variable.");

builder.Services.AddSingleton<IDbConnectionFactory>(new SqlConnectionFactory(connectionString));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserSchemaRepository, UserSchemaRepository>();
builder.Services.AddScoped<ISchemaInformationRepository, SchemaInformationRepository>();
builder.Services.AddScoped<ISchemaShareRepository, SchemaShareRepository>();

builder.Services.AddMemoryCache();

builder.Services.AddResponseCompression(opts =>
{
    opts.EnableForHttps = true;
    opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    opts.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
    opts.MimeTypes = Microsoft.AspNetCore.ResponseCompression.ResponseCompressionDefaults.MimeTypes
        .Concat(["application/json", "text/plain"]);
});
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(
    o => o.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(
    o => o.Level = System.IO.Compression.CompressionLevel.Fastest);

builder.Services.AddControllers(o =>
    {
        o.Filters.Add(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(60 * 1024 * 1024));
    })
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = null;
        // Match legacy Newtonsoft.Json behavior: emit literal non-ASCII bytes (e.g. NBSP)
        // instead of \uXXXX escapes. Prevents ~6x inflation per non-ASCII char on every save round-trip.
        o.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

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

app.UseResponseCompression();

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("MyCorsPolicy");

app.UseAuthorization();

app.MapControllers();

// Background cache warm-up: load all active schemas into memory after startup
_ = Task.Run(async () =>
{
    await Task.Delay(500); // let the server fully start first
    using var scope = app.Services.CreateScope();
    var repo = scope.ServiceProvider.GetRequiredService<ISchemaInformationRepository>();
    var cache = scope.ServiceProvider.GetRequiredService<IMemoryCache>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var schemas = repo.GetAllActive();
        int count = 0;
        foreach (var (userSchemaId, schemaInfo) in schemas)
        {
            cache.Set($"schema:{userSchemaId}", schemaInfo, TimeSpan.FromMinutes(60));
            count++;
        }
        logger.LogInformation("Cache warm-up complete: {Count} schemas loaded.", count);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Cache warm-up failed — schemas will load on first request.");
    }
});

app.Run();
