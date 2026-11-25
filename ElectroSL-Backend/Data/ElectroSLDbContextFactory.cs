
using ElectroSL_Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ElectroSL_Backend.Data;

public class ElectroSLDbContextFactory
    : IDesignTimeDbContextFactory<ElectroSLDbContext>
{
    public ElectroSLDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder =
            new DbContextOptionsBuilder<ElectroSLDbContext>();

        var serverVersion =
            new MariaDbServerVersion(new Version(10, 11, 16));

        optionsBuilder.UseMySql(
            "Server=localhost;Database=electrosl_db;User=root;Password=;",
            serverVersion
        );

        return new ElectroSLDbContext(optionsBuilder.Options);
    }
}
