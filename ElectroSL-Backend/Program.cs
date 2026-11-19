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

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ElectroSLDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mySqlOptions => mySqlOptions.CommandTimeout(120)
    ));

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<IMatchingService, MatchingService>();
builder.Services.AddScoped<IMediaStorageService, LocalMediaStorageService>();
builder.Services.AddScoped<DistanceCalculationService>();
builder.Services.AddScoped<WalletService>();
builder.Services.AddScoped<INotificationService, NotificationService>(); // Added NotificationService

// Add SignalR
builder.Services.AddSignalR(); // Added SignalR

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:SecretKey"] ?? "ElectroSL_Super_Secret_Key_Change_This_In_Production";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy.WithOrigins("http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()); // AllowCredentials is required for SignalR
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Map SignalR Hubs
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<JobTrackingHub>("/hubs/jobtracking");

app.Run();