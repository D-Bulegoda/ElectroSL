using ElectroSL_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Data;

public class ElectroSLDbContext : DbContext
{
    public ElectroSLDbContext(DbContextOptions<ElectroSLDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<ElectricianProfile> ElectricianProfiles { get; set; }
    public DbSet<SimulatorResult> SimulatorResults { get; set; }
    public DbSet<Job> Jobs { get; set; }
    public DbSet<JobBid> JobBids { get; set; }
    public DbSet<EquipmentCatalog> EquipmentCatalog { get; set; }
    public DbSet<JobUsedEquipment> JobUsedEquipments { get; set; }
    public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
    public DbSet<Review> Reviews { get; set; }
}