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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. User Entity Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserId);
            entity.Property(u => u.Email).HasMaxLength(150).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Name).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(30).IsRequired();
            entity.Property(u => u.Phone).HasMaxLength(20);
            entity.Property(u => u.OtpCodeHash).HasMaxLength(256);
        });

        // 2. ElectricianProfile Entity Configuration (1-to-0..1 with User)
        modelBuilder.Entity<ElectricianProfile>(entity =>
        {
            entity.HasKey(ep => ep.ProfileId);
            entity.Property(ep => ep.AppWalletBalance).HasPrecision(18, 2);
            entity.Property(ep => ep.Specialization).HasMaxLength(100);
            entity.Property(ep => ep.NicDocumentUrl).HasMaxLength(500).HasDefaultValue(string.Empty);
            entity.Property(ep => ep.VerificationStatus).HasMaxLength(50).HasDefaultValue("Pending");

            entity.HasOne(ep => ep.User)
                  .WithOne(u => u.ElectricianProfile)
                  .HasForeignKey<ElectricianProfile>(ep => ep.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(ep => ep.UserId).IsUnique();
        });

        // 3. Job Entity Configuration
        modelBuilder.Entity<Job>(entity =>
        {
            entity.HasKey(j => j.JobId);
            entity.Property(j => j.JobType).HasMaxLength(50).IsRequired();
            entity.Property(j => j.Status).HasMaxLength(30).IsRequired();
            entity.Property(j => j.StartOTP).HasMaxLength(10);
            entity.Property(j => j.FinalApprovalOTP).HasMaxLength(10);

            // Customer (User 1-to-Many Job)
            entity.HasOne(j => j.Customer)
                  .WithMany(u => u.CustomerJobs)
                  .HasForeignKey(j => j.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Electrician (User 1-to-Many Job, Optional)
            entity.HasOne(j => j.Electrician)
                  .WithMany(u => u.AssignedJobs)
                  .HasForeignKey(j => j.ElectricianId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. JobBid Entity Configuration
        modelBuilder.Entity<JobBid>(entity =>
        {
            entity.HasKey(jb => jb.BidId);
            entity.Property(jb => jb.EstimatedAmount).HasPrecision(18, 2);

            // Job (1-to-Many JobBid)
            entity.HasOne(jb => jb.Job)
                  .WithMany(j => j.JobBids)
                  .HasForeignKey(jb => jb.JobId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Electrician (User 1-to-Many JobBid)
            entity.HasOne(jb => jb.Electrician)
                  .WithMany(u => u.JobBids)
                  .HasForeignKey(jb => jb.ElectricianId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 5. JobUsedEquipment Entity Configuration
        modelBuilder.Entity<JobUsedEquipment>(entity =>
        {
            entity.HasKey(jue => jue.Id);
            entity.Property(jue => jue.ClaimedPrice).HasPrecision(18, 2);
            entity.Property(jue => jue.VariancePercentage).HasPrecision(5, 2);
            entity.Property(jue => jue.ItemName).HasMaxLength(150);

            // Job (1-to-Many JobUsedEquipment) - Restrict delete behavior as requested
            entity.HasOne(jue => jue.Job)
                  .WithMany(j => j.JobUsedEquipments)
                  .HasForeignKey(jue => jue.JobId)
                  .OnDelete(DeleteBehavior.Restrict);

            // EquipmentCatalog (1-to-Many JobUsedEquipment, Optional) - Restrict delete behavior
            entity.HasOne(jue => jue.EquipmentCatalog)
                  .WithMany(ec => ec.JobUsedEquipments)
                  .HasForeignKey(jue => jue.CatalogItemId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. PaymentTransaction Entity Configuration (1-to-1 Optional with Job)
        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(pt => pt.TransactionId);
            entity.Property(pt => pt.TotalAmount).HasPrecision(18, 2);
            entity.Property(pt => pt.PlatformCommission).HasPrecision(18, 2);
            entity.Property(pt => pt.ElectricianEarning).HasPrecision(18, 2);
            entity.Property(pt => pt.PaymentMethod).HasMaxLength(20).IsRequired();

            entity.HasOne(pt => pt.Job)
                  .WithOne(j => j.PaymentTransaction)
                  .HasForeignKey<PaymentTransaction>(pt => pt.JobId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 7. Review Entity Configuration (1-to-1 with Job, 1-to-Many with Electrician)
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(r => r.ReviewId);
            entity.Property(r => r.Rating).HasPrecision(3, 2);

            // Job (1-to-1 Review)
            entity.HasOne(r => r.Job)
                  .WithOne(j => j.Review)
                  .HasForeignKey<Review>(r => r.JobId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Electrician (User 1-to-Many Review)
            entity.HasOne(r => r.Electrician)
                  .WithMany(u => u.ReviewsReceived)
                  .HasForeignKey(r => r.ElectricianId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 8. SimulatorResult Entity Configuration (User 1-to-Many SimulatorResult)
        modelBuilder.Entity<SimulatorResult>(entity =>
        {
            entity.HasKey(sr => sr.Id);

            entity.HasOne(sr => sr.Electrician)
                  .WithMany(u => u.SimulatorResults)
                  .HasForeignKey(sr => sr.ElectricianId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 9. EquipmentCatalog Entity Configuration
        modelBuilder.Entity<EquipmentCatalog>(entity =>
        {
            entity.HasKey(ec => ec.ItemId);
            entity.Property(ec => ec.StandardMarketPrice).HasPrecision(18, 2);
            entity.Property(ec => ec.Category).HasMaxLength(100);
            entity.Property(ec => ec.BrandName).HasMaxLength(100);
            entity.Property(ec => ec.Specification).HasMaxLength(255);
        });
    }
}
