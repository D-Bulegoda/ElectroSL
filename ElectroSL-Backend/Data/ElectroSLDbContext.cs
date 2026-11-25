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
    public DbSet<EquipmentPriceHistory> EquipmentPriceHistories { get; set; }
    public DbSet<JobUsedEquipment> JobUsedEquipments { get; set; }
    public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<TechnicianAuditLog> TechnicianAuditLogs { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<TechnicianPayoutRecord> TechnicianPayoutRecords { get; set; }
    public DbSet<JobAgreedLabourAudit> JobAgreedLabourAudits { get; set; }
    public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }

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
            entity.Property(u => u.IsActive).HasDefaultValue(true).IsRequired();
            entity.Property(u => u.AccountStatus).HasMaxLength(30).HasDefaultValue("Active").IsRequired();
            entity.Property(u => u.SuspensionReason).HasMaxLength(500);
            entity.Property(u => u.ConcurrencyVersion).HasDefaultValue(1).IsConcurrencyToken();

            entity.HasIndex(u => u.AccountStatus);
            entity.HasIndex(u => u.Role);
            entity.HasIndex(u => u.IsActive);
        });

        // 2. ElectricianProfile Entity Configuration (1-to-0..1 with User)
        modelBuilder.Entity<ElectricianProfile>(entity =>
        {
            entity.HasKey(ep => ep.ProfileId);
            entity.Property(ep => ep.AppWalletBalance).HasPrecision(18, 2);
            entity.Property(ep => ep.OutstandingCommissionDebt).HasPrecision(18, 2);
            entity.Property(ep => ep.Specialization).HasMaxLength(100);
            entity.Property(ep => ep.NicDocumentUrl).HasMaxLength(500).HasDefaultValue(string.Empty);
            entity.Property(ep => ep.VerificationStatus).HasMaxLength(50).HasDefaultValue("Pending").IsConcurrencyToken();
            entity.Property(ep => ep.ReviewedAt).IsConcurrencyToken();

            entity.Property(ep => ep.TechnicalSkillRating);
            entity.Property(ep => ep.TechnicalSkillAssessmentNote).HasMaxLength(1000);
            entity.Property(ep => ep.TechnicalSkillRatedAtUtc);
            entity.Property(ep => ep.TechnicalSkillRatedByAdminId);

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

            // Phase 3 — Task 3.3.1: Job Operations Database Foundation & Concurrency Token
            entity.Property(j => j.ConcurrencyVersion).HasDefaultValue(1).IsConcurrencyToken();
            entity.Property(j => j.CancellationReason).HasMaxLength(500);
            entity.Property(j => j.DisputeReason).HasMaxLength(500);
            entity.Property(j => j.DisputeResolutionNotes).HasMaxLength(1000);

            // AssignedByAdmin (User 1-to-Many Job, Optional)
            entity.HasOne(j => j.AssignedByAdmin)
                  .WithMany()
                  .HasForeignKey(j => j.AssignedByAdminId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            // CancelledByUser (User 1-to-Many Job, Optional)
            entity.HasOne(j => j.CancelledByUser)
                  .WithMany()
                  .HasForeignKey(j => j.CancelledByUserId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            // Phase 3 Task 3.4.5E — Authoritative Agreed Labour Amount & Audit
            entity.Property(j => j.AgreedLabourAmount)
                  .HasPrecision(18, 2)
                  .IsRequired(false);

            entity.Property(j => j.AgreedLabourNotes)
                  .HasMaxLength(500);

            entity.HasOne(j => j.AgreedLabourAmountSetByAdmin)
                  .WithMany()
                  .HasForeignKey(j => j.AgreedLabourAmountSetByAdminId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(j => j.Status);
            entity.HasIndex(j => j.JobType);
            entity.HasIndex(j => j.IsEmergency);
            entity.HasIndex(j => j.AssignedByAdminId);
            entity.HasIndex(j => j.CancelledByUserId);
            entity.HasIndex(j => j.AgreedLabourAmountSetByAdminId);
        });

        // JobAgreedLabourAudit Entity Configuration
        modelBuilder.Entity<JobAgreedLabourAudit>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.PreviousAmount).HasPrecision(18, 2);
            entity.Property(a => a.NewAmount).HasPrecision(18, 2).IsRequired();
            entity.Property(a => a.Notes).HasMaxLength(500);
            entity.Property(a => a.ChangedAtUtc).IsRequired();

            entity.HasOne(a => a.Job)
                  .WithMany(j => j.AgreedLabourAudits)
                  .HasForeignKey(a => a.JobId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Admin)
                  .WithMany()
                  .HasForeignKey(a => a.AdminId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(a => a.JobId);
            entity.HasIndex(a => a.AdminId);
            entity.HasIndex(a => a.ChangedAtUtc);
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
            entity.Property(jue => jue.Status)
                  .HasMaxLength(50)
                  .HasDefaultValue("Legacy")
                  .IsConcurrencyToken();
            entity.Property(jue => jue.AdminReviewNotes).HasMaxLength(1000);

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

            // ReviewedByAdmin (User Optional 1-to-Many JobUsedEquipment)
            entity.HasOne(jue => jue.ReviewedByAdmin)
                  .WithMany(u => u.ReviewedEquipments)
                  .HasForeignKey(jue => jue.ReviewedByAdminId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(jue => jue.ReviewedByAdminId);
            entity.HasIndex(jue => jue.CatalogItemId);
            entity.HasIndex(jue => jue.JobId);

            // Phase 2: Database-level uniqueness on (JobId, CatalogItemId) to prevent duplicate claims
            // Allows multiple NULL CatalogItemId values for legacy/unmapped claims per standard SQL/MySQL semantics
            entity.HasIndex(jue => new { jue.JobId, jue.CatalogItemId })
                  .IsUnique();
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
            entity.Property(ec => ec.PriceVarianceThreshold).HasPrecision(5, 2).HasDefaultValue(5.00m);
            entity.Property(ec => ec.Category).HasMaxLength(100);
            entity.Property(ec => ec.BrandName).HasMaxLength(100);
            entity.Property(ec => ec.Specification).HasMaxLength(255);
            entity.Property(ec => ec.ItemName).HasMaxLength(150).HasDefaultValue(string.Empty);
            entity.Property(ec => ec.Description).HasMaxLength(1000);
            entity.Property(ec => ec.Unit).HasMaxLength(50).HasDefaultValue("Unit");
            entity.Property(ec => ec.IsActive).HasDefaultValue(true);
            entity.Property(ec => ec.ConcurrencyVersion).IsConcurrencyToken().HasDefaultValue(1);
            entity.Property(ec => ec.LastUpdated).IsConcurrencyToken();

            entity.HasIndex(ec => ec.Category);
            entity.HasIndex(ec => ec.IsActive);
        });

        // 10. EquipmentPriceHistory Entity Configuration
        modelBuilder.Entity<EquipmentPriceHistory>(entity =>
        {
            entity.HasKey(eph => eph.Id);
            entity.Property(eph => eph.OldPrice).HasPrecision(18, 2);
            entity.Property(eph => eph.NewPrice).HasPrecision(18, 2);
            entity.Property(eph => eph.ChangePercentage).HasPrecision(5, 2);
            entity.Property(eph => eph.Reason).HasMaxLength(1000);

            entity.HasOne(eph => eph.EquipmentCatalog)
                  .WithMany(ec => ec.PriceHistories)
                  .HasForeignKey(eph => eph.CatalogItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(eph => eph.ChangedByAdmin)
                  .WithMany(u => u.PriceChangeActions)
                  .HasForeignKey(eph => eph.ChangedByAdminId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(eph => eph.CatalogItemId);
            entity.HasIndex(eph => eph.ChangedByAdminId);
            entity.HasIndex(eph => eph.EffectiveDateUtc);
        });

        // 11. TechnicianAuditLog Entity Configuration
        modelBuilder.Entity<TechnicianAuditLog>(entity =>
        {
            entity.HasKey(al => al.Id);
            entity.Property(al => al.Action).HasMaxLength(50).IsRequired();
            entity.Property(al => al.PreviousStatus).HasMaxLength(50).IsRequired();
            entity.Property(al => al.NewStatus).HasMaxLength(50).IsRequired();
            entity.Property(al => al.Reason).HasMaxLength(1000);

            entity.HasOne(al => al.ElectricianProfile)
                  .WithMany(ep => ep.AuditLogs)
                  .HasForeignKey(al => al.ElectricianProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(al => al.Admin)
                  .WithMany(u => u.AdminAuditActions)
                  .HasForeignKey(al => al.AdminId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. WalletTransaction Entity Configuration (Immutable Financial Ledger)
        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(wt => wt.TransactionId);
            entity.Property(wt => wt.Amount).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.BalanceBefore).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.BalanceAfter).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.CommissionDebtBefore).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.CommissionDebtAfter).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.CommissionDebtRecovered).HasPrecision(18, 2).IsRequired();
            entity.Property(wt => wt.TransactionType).HasConversion<int>().IsRequired();
            entity.Property(wt => wt.Description).HasMaxLength(255).IsRequired();
            entity.Property(wt => wt.ExternalReferenceNumber).HasMaxLength(100);

            entity.HasOne(wt => wt.ElectricianProfile)
                  .WithMany(ep => ep.WalletTransactions)
                  .HasForeignKey(wt => wt.ElectricianProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wt => wt.Job)
                  .WithMany()
                  .HasForeignKey(wt => wt.JobId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wt => wt.PaymentTransaction)
                  .WithMany(pt => pt.WalletTransactions)
                  .HasForeignKey(wt => wt.PaymentTransactionId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wt => wt.PayoutRecord)
                  .WithMany(pr => pr.WalletTransactions)
                  .HasForeignKey(wt => wt.PayoutRecordId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wt => wt.InitiatedByAdmin)
                  .WithMany(u => u.AdminInitiatedWalletTransactions)
                  .HasForeignKey(wt => wt.InitiatedByAdminId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(wt => wt.ElectricianProfileId);
            entity.HasIndex(wt => wt.JobId);
            entity.HasIndex(wt => wt.PaymentTransactionId);
            entity.HasIndex(wt => wt.PayoutRecordId);
            entity.HasIndex(wt => wt.CreatedAtUtc);
            entity.HasIndex(wt => wt.TransactionType);

            // Database-level idempotency constraint: a PaymentTransaction can only have one ledger entry per TransactionType
            // Standard SQL / MariaDB semantics allow multiple NULLs for non-job records (e.g. payouts, adjustments)
            entity.HasIndex(wt => new { wt.PaymentTransactionId, wt.TransactionType })
                  .IsUnique();
        });

        // 13. TechnicianPayoutRecord Entity Configuration (Admin Payout Tracking)
        modelBuilder.Entity<TechnicianPayoutRecord>(entity =>
        {
            entity.HasKey(pr => pr.PayoutId);
            entity.Property(pr => pr.Amount).HasPrecision(18, 2).IsRequired();
            entity.Property(pr => pr.BankName).HasMaxLength(100).IsRequired();
            entity.Property(pr => pr.AccountNumberMasked).HasMaxLength(30).IsRequired();
            entity.Property(pr => pr.BankTransferReference).HasMaxLength(100).IsRequired();
            entity.Property(pr => pr.AdminNotes).HasMaxLength(500).IsRequired();
            entity.Property(pr => pr.ReversalReason).HasMaxLength(500);

            entity.HasOne(pr => pr.ElectricianProfile)
                  .WithMany(ep => ep.PayoutRecords)
                  .HasForeignKey(pr => pr.ElectricianProfileId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(pr => pr.RecordedByAdmin)
                  .WithMany(u => u.AdminRecordedPayouts)
                  .HasForeignKey(pr => pr.RecordedByAdminId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(pr => pr.ElectricianProfileId);
            entity.HasIndex(pr => pr.RecordedByAdminId);
            entity.HasIndex(pr => pr.DisbursedAtUtc);
        });

        // 14. AdminAuditLog Entity Configuration (Unified Immutable Administrative Audit Trail)
        modelBuilder.Entity<AdminAuditLog>(entity =>
        {
            entity.HasKey(a => a.AuditLogId);
            entity.Property(a => a.ActionType).HasMaxLength(100).IsRequired();
            entity.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(a => a.EntityId).HasMaxLength(100).IsRequired();
            entity.Property(a => a.Description).HasMaxLength(1000).IsRequired();
            entity.Property(a => a.Reason).HasMaxLength(1000);
            entity.Property(a => a.IpAddress).HasMaxLength(50);
            entity.Property(a => a.CreatedAtUtc).IsRequired();

            entity.HasOne(a => a.AdminUser)
                  .WithMany()
                  .HasForeignKey(a => a.AdminUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(a => a.AdminUserId);
            entity.HasIndex(a => a.ActionType);
            entity.HasIndex(a => new { a.EntityType, a.EntityId });
            entity.HasIndex(a => a.CreatedAtUtc);
        });
    }
}