using System;
using System.Text;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Hubs;
using ElectroSL_Backend.Services;
using ElectroSL_Backend.Services.Implementations;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller and API configuration
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 2. Swagger with JWT Bearer configuration
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ElectroSL API",
        Version = "v1",
        Description =
            "ElectroSL Platform Backend API with " +
            "Role-Based JWT Authorization"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description =
            "Enter your JWT token directly " +
            "(without 'Bearer ' prefix)."
    });

    options.AddSecurityRequirement(doc =>
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference("Bearer", doc),
                new List<string>()
            }
        });
});

// 3. Database connection
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

ServerVersion serverVersion;

try
{
    serverVersion = ServerVersion.AutoDetect(connectionString);
}
catch
{
    // Fallback when the database cannot be reached.
    serverVersion =
        ServerVersion.Parse("10.11.16-mariadb");
}

builder.Services.AddDbContext<ElectroSLDbContext>(options =>
    options.UseMySql(
        connectionString,
        serverVersion,
        mySqlOptions =>
            mySqlOptions.CommandTimeout(120)));

// 4. JWT authentication
var jwtSecretKey =
    builder.Configuration["JwtSettings:SecretKey"]
    ?? "ElectroSL_Super_Secret_Key_At_Least_32_Characters_Long_For_Jwt_Security!";

var jwtIssuer =
    builder.Configuration["JwtSettings:Issuer"]
    ?? "ElectroSL";

var jwtAudience =
    builder.Configuration["JwtSettings:Audience"]
    ?? "ElectroSL_Clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSecretKey)),

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
});

builder.Services.AddAuthorization();

// 5. Scoped application services and SignalR
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAdminAuditService, AdminAuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IDocumentStorageService,
    DocumentStorageService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<IMatchingService, MatchingService>();
builder.Services.AddScoped<IMediaStorageService,
    LocalMediaStorageService>();
builder.Services.AddScoped<DistanceCalculationService>();
builder.Services.AddScoped<WalletService>();
builder.Services.AddScoped<IAdminFinancialService, AdminFinancialService>();
builder.Services.AddScoped<IPaymentProcessingService, PaymentProcessingService>();
builder.Services.AddScoped<INotificationService,
    NotificationService>();

builder.Services.AddSignalR();

// 6. CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// 7. HTTP pipeline configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "ElectroSL API v1");
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

// Authentication must precede authorization.
app.UseAuthentication();

// Enforce live account status for authenticated JWT requests.
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var idClaim =
            context.User
                .FindFirst(
                    System.Security.Claims
                        .ClaimTypes.NameIdentifier)
                ?.Value
            ?? context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst("id")?.Value;

        if (int.TryParse(idClaim, out var userId))
        {
            var db =
                context.RequestServices
                    .GetRequiredService<ElectroSLDbContext>();

            var accountInfo = await db.Users
                .AsNoTracking()
                .Where(u => u.UserId == userId)
                .Select(u => new
                {
                    u.IsActive,
                    u.AccountStatus,
                    u.SuspensionReason
                })
                .FirstOrDefaultAsync();

            if (accountInfo != null &&
                (!accountInfo.IsActive ||
                 accountInfo.AccountStatus != "Active"))
            {
                context.Response.StatusCode =
                    StatusCodes.Status403Forbidden;

                context.Response.ContentType =
                    "application/json";

                var status =
                    accountInfo.AccountStatus ?? "Inactive";

                var reason =
                    !string.IsNullOrWhiteSpace(
                        accountInfo.SuspensionReason)
                        ? accountInfo.SuspensionReason
                        : "Your account is not active. " +
                          "Please contact customer support.";

                var payload =
                    System.Text.Json.JsonSerializer.Serialize(
                        new
                        {
                            message =
                                $"Access denied. Your account is " +
                                $"{status.ToLowerInvariant()}. " +
                                $"{reason}",
                            accountStatus = status,
                            suspensionReason =
                                accountInfo.SuspensionReason
                        });

                await context.Response.WriteAsync(payload);
                return;
            }
        }
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>(
    "/hubs/notifications");

// Seed the admin account at startup.
await DbInitializer.SeedAdminAsync(
    app.Services,
    builder.Configuration);

app.Run();