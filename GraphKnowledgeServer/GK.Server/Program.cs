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

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null);
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
