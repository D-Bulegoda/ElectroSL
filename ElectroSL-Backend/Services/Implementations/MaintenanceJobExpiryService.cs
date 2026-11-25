
using ElectroSL_Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class MaintenanceJobExpiryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceJobExpiryService> _logger;

    private const double RequiredActiveHours = 8.0;

    private static readonly TimeZoneInfo SriLankaTimeZone =
        GetSriLankaTimeZone();

    public MaintenanceJobExpiryService(
        IServiceScopeFactory scopeFactory,
        ILogger<MaintenanceJobExpiryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var context = scope.ServiceProvider
                    .GetRequiredService<ElectroSLDbContext>();

                var pendingJobs = await context.Jobs
                    .Where(j =>
                        j.JobType == "Maintenance" &&
                        j.Status == "Pending")
                    .ToListAsync(stoppingToken);

                var currentUtc = DateTime.UtcNow;
                var expiredCount = 0;

                foreach (var job in pendingJobs)
                {
                    var activeHours = CalculateActiveHours(
                        job.CreatedAt,
                        currentUtc);

                    if (activeHours >= RequiredActiveHours)
                    {
                        job.Status = "Expired";
                        expiredCount++;
                    }
                }

                if (expiredCount > 0)
                {
                    await context.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation(
                        "{Count} maintenance jobs expired.",
                        expiredCount);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while checking maintenance job expiry.");
            }

            await Task.Delay(
                TimeSpan.FromMinutes(1),
                stoppingToken);
        }
    }

    private static double CalculateActiveHours(
        DateTime createdAtUtc,
        DateTime currentUtc)
    {
        if (createdAtUtc.Kind == DateTimeKind.Unspecified)
            createdAtUtc = DateTime.SpecifyKind(
                createdAtUtc,
                DateTimeKind.Utc);

        if (currentUtc < createdAtUtc)
            return 0;

        var localStart = TimeZoneInfo.ConvertTimeFromUtc(
            createdAtUtc,
            SriLankaTimeZone);

        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(
            currentUtc,
            SriLankaTimeZone);

        double activeMinutes = 0;

        for (var day = localStart.Date;
             day <= localEnd.Date;
             day = day.AddDays(1))
        {
            var activeWindowStart = day.AddHours(6);
            var activeWindowEnd = day.AddHours(20);

            var overlapStart = localStart > activeWindowStart
                ? localStart
                : activeWindowStart;

            var overlapEnd = localEnd < activeWindowEnd
                ? localEnd
                : activeWindowEnd;

            if (overlapEnd > overlapStart)
            {
                activeMinutes +=
                    (overlapEnd - overlapStart).TotalMinutes;
            }
        }

        return activeMinutes / 60.0;
    }

    private static TimeZoneInfo GetSriLankaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                "Sri Lanka Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                "Asia/Colombo");
        }
    }
}
