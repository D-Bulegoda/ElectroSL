using System.Text;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Data;

public static class DbInitializer
{
    public static async Task SeedAdminAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        using var scope = serviceProvider.CreateScope();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DbInitializer");

        try
        {
            var context = scope.ServiceProvider.GetRequiredService<ElectroSLDbContext>();

            // Fast connectivity probe (3 second timeout) to avoid blocking Web API startup when MySQL is offline
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            bool canConnect = await context.Database.CanConnectAsync(cts.Token);
            if (!canConnect)
            {
                logger.LogWarning("[DbInitializer] Database server is offline or unreachable. Skipping initialization.");
                return;
            }

            // 1. Seed Initial Admin Account (Phase 0 Foundation - required for admin access)
            await SeedAdminAccountAsync(context, configuration, logger, cts.Token);

            // 2. Development-only demo seeding: strictly disabled in production
            // Requires explicit opt-in via ELECTROSL_SEED_DEV_DATA="true" in Development environment
            var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
            var seedDevData = string.Equals(Environment.GetEnvironmentVariable("ELECTROSL_SEED_DEV_DATA"), "true", StringComparison.OrdinalIgnoreCase);

            if (env.IsDevelopment() && seedDevData)
            {
                logger.LogInformation("[DbInitializer] ELECTROSL_SEED_DEV_DATA=true in Development. Seeding demo technicians...");
                var documentStorage = scope.ServiceProvider.GetRequiredService<IDocumentStorageService>();
                await SeedTechniciansAsync(context, documentStorage, logger, cts.Token);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("[DbInitializer] Initialization note: {Message}", ex.Message);
        }
    }

    private static async Task SeedAdminAccountAsync(ElectroSLDbContext context, IConfiguration configuration, ILogger logger, CancellationToken ct)
    {
        bool adminExists = await context.Users.AnyAsync(u => u.Role == "Admin", ct);
        if (adminExists)
        {
            return;
        }

        var initialEmail = configuration["AdminSettings:InitialEmail"]
            ?? Environment.GetEnvironmentVariable("ELECTROSL_ADMIN_EMAIL")
            ?? "admin@electrosl.lk";

        var initialPassword = configuration["AdminSettings:InitialPassword"]
            ?? Environment.GetEnvironmentVariable("ELECTROSL_ADMIN_PASSWORD");

        if (string.IsNullOrWhiteSpace(initialPassword))
        {
            logger.LogWarning("[DbInitializer] No initial admin password configured. Set ELECTROSL_ADMIN_PASSWORD.");
            return;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword);
        var adminUser = new User
        {
            Name = configuration["AdminSettings:InitialName"] ?? "System Administrator",
            Email = initialEmail.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Role = "Admin",
            Phone = "0112345678",
            IsPhoneVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync(ct);
        logger.LogInformation("[DbInitializer] Administrator account created: {Email}", adminUser.Email);
    }

    private static async Task SeedTechniciansAsync(
        ElectroSLDbContext context, 
        IDocumentStorageService documentStorage, 
        ILogger logger, 
        CancellationToken ct)
    {
        bool hasElectricians = await context.ElectricianProfiles.AnyAsync(ct);
        if (hasElectricians)
        {
            return;
        }

        // Create sample physical documents in the secure directory outside wwwroot
        var storageDir = documentStorage.GetStorageDirectory();
        Directory.CreateDirectory(storageDir);

        var samplePdfBytes = Encoding.UTF8.GetBytes(
            "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
            "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
            "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n" +
            "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n" +
            "trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF");

        var samplePngBytes = new byte[] {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
            0x42, 0x60, 0x82
        };

        // Write physical files
        var nic1 = "nic_sample_sunil.png";
        var nvq1 = "nvq_sample_sunil.pdf";
        var nic2 = "nic_sample_kamal.png";
        var nvq2 = "nvq_sample_kamal.pdf";

        await File.WriteAllBytesAsync(Path.Combine(storageDir, nic1), samplePngBytes, ct);
        await File.WriteAllBytesAsync(Path.Combine(storageDir, nvq1), samplePdfBytes, ct);
        await File.WriteAllBytesAsync(Path.Combine(storageDir, nic2), samplePngBytes, ct);
        await File.WriteAllBytesAsync(Path.Combine(storageDir, nvq2), samplePdfBytes, ct);

        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPass@123");

        // 1. Applicant Ready for Approval (Passed simulator + documents uploaded)
        var user1 = new User
        {
            Name = "Sunil Perera",
            Email = "sunil.electrician@gmail.com",
            PasswordHash = defaultPasswordHash,
            Role = "Electrician",
            Phone = "0771234567",
            IsPhoneVerified = true,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };
        context.Users.Add(user1);
        await context.SaveChangesAsync(ct);

        var profile1 = new ElectricianProfile
        {
            UserId = user1.UserId,
            Specialization = "Domestic Wiring & Solar Installation",
            NicDocumentUrl = nic1,
            NvqCertificateUrl = nvq1,
            VerificationStatus = "Pending",
            IsApprovedByAdmin = false
        };
        context.ElectricianProfiles.Add(profile1);

        var sim1 = new SimulatorResult
        {
            ElectricianId = user1.UserId,
            TotalScore = 88,
            TimeTakenSeconds = 145,
            SafetyMistakesCount = 0,
            IsPassed = true,
            AttemptDate = DateTime.UtcNow.AddDays(-2)
        };
        context.SimulatorResults.Add(sim1);

        // 2. Applicant with Failed Simulator (Cannot approve yet)
        var user2 = new User
        {
            Name = "Kamal Silva",
            Email = "kamal.silva@gmail.com",
            PasswordHash = defaultPasswordHash,
            Role = "Electrician",
            Phone = "0719876543",
            IsPhoneVerified = true,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };
        context.Users.Add(user2);
        await context.SaveChangesAsync(ct);

        var profile2 = new ElectricianProfile
        {
            UserId = user2.UserId,
            Specialization = "Industrial Machinery Wiring",
            NicDocumentUrl = nic2,
            NvqCertificateUrl = nvq2,
            VerificationStatus = "Pending",
            IsApprovedByAdmin = false
        };
        context.ElectricianProfiles.Add(profile2);

        var sim2 = new SimulatorResult
        {
            ElectricianId = user2.UserId,
            TotalScore = 42,
            TimeTakenSeconds = 310,
            SafetyMistakesCount = 3,
            IsPassed = false,
            AttemptDate = DateTime.UtcNow.AddDays(-1)
        };
        context.SimulatorResults.Add(sim2);

        // 3. Approved Electrician
        var user3 = new User
        {
            Name = "Nuwan Bandara",
            Email = "nuwan.bandara@gmail.com",
            PasswordHash = defaultPasswordHash,
            Role = "Electrician",
            Phone = "0755554321",
            IsPhoneVerified = true,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Users.Add(user3);
        await context.SaveChangesAsync(ct);

        var profile3 = new ElectricianProfile
        {
            UserId = user3.UserId,
            Specialization = "Commercial Switchboards & 3-Phase",
            NicDocumentUrl = nic1,
            NvqCertificateUrl = nvq1,
            VerificationStatus = "Approved",
            IsApprovedByAdmin = true,
            ReviewedAt = DateTime.UtcNow.AddDays(-5),
            IsOnline = true
        };
        context.ElectricianProfiles.Add(profile3);

        // 4. Rejected Application
        var user4 = new User
        {
            Name = "Dinesh Fernando",
            Email = "dinesh.fernando@gmail.com",
            PasswordHash = defaultPasswordHash,
            Role = "Electrician",
            Phone = "0781112233",
            IsPhoneVerified = true,
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        };
        context.Users.Add(user4);
        await context.SaveChangesAsync(ct);

        var profile4 = new ElectricianProfile
        {
            UserId = user4.UserId,
            Specialization = "Domestic Repair",
            NicDocumentUrl = nic1,
            NvqCertificateUrl = string.Empty, // Missing NVQ
            VerificationStatus = "Rejected",
            IsApprovedByAdmin = false,
            RejectionReason = "NVQ Level 4 certificate is missing or invalid. Please upload accredited TVEC certification.",
            ReviewedAt = DateTime.UtcNow.AddDays(-4)
        };
        context.ElectricianProfiles.Add(profile4);
        await context.SaveChangesAsync(ct);

        // Seed audit logs for already approved and rejected sample electricians
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == "Admin", ct);
        int adminId = adminUser?.UserId ?? 1;

        context.TechnicianAuditLogs.AddRange(
            new TechnicianAuditLog
            {
                ElectricianProfileId = profile3.ProfileId,
                AdminId = adminId,
                Action = "Approved",
                PreviousStatus = "Pending",
                NewStatus = "Approved",
                Reason = "Accreditation approved after full physical document verification and passed simulator test.",
                TimestampUtc = DateTime.UtcNow.AddDays(-5)
            },
            new TechnicianAuditLog
            {
                ElectricianProfileId = profile4.ProfileId,
                AdminId = adminId,
                Action = "Rejected",
                PreviousStatus = "Pending",
                NewStatus = "Rejected",
                Reason = "NVQ Level 4 certificate is missing or invalid. Please upload accredited TVEC certification.",
                TimestampUtc = DateTime.UtcNow.AddDays(-4)
            }
        );

        await context.SaveChangesAsync(ct);
        logger.LogInformation("[DbInitializer] Successfully seeded 4 sample technician applications with physical documents and audit history.");
    }
}
