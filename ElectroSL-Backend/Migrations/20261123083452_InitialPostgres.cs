using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EquipmentCatalog",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ItemName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false, defaultValue: ""),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BrandName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Specification = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Unit"),
                    StandardMarketPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PriceVarianceThreshold = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 5.00m),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ConcurrencyVersion = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentCatalog", x => x.ItemId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsPhoneVerified = table.Column<bool>(type: "boolean", nullable: false),
                    OtpCodeHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    OtpExpiryUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AccountStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    SuspensionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeactivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SuspendedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConcurrencyVersion = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "AdminAuditLogs",
                columns: table => new
                {
                    AuditLogId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdminUserId = table.Column<int>(type: "integer", nullable: false),
                    ActionType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    OldValues = table.Column<string>(type: "text", nullable: true),
                    NewValues = table.Column<string>(type: "text", nullable: true),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminAuditLogs", x => x.AuditLogId);
                    table.ForeignKey(
                        name: "FK_AdminAuditLogs_Users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ElectricianProfiles",
                columns: table => new
                {
                    ProfileId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    NvqCertificateUrl = table.Column<string>(type: "text", nullable: false),
                    NicDocumentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false, defaultValue: ""),
                    Specialization = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    IsApprovedByAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    ReviewedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsOnline = table.Column<bool>(type: "boolean", nullable: false),
                    CurrentLat = table.Column<double>(type: "double precision", nullable: false),
                    CurrentLng = table.Column<double>(type: "double precision", nullable: false),
                    AppWalletBalance = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    OutstandingCommissionDebt = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TechnicalSkillRating = table.Column<int>(type: "integer", nullable: true),
                    TechnicalSkillAssessmentNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TechnicalSkillRatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TechnicalSkillRatedByAdminId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElectricianProfiles", x => x.ProfileId);
                    table.ForeignKey(
                        name: "FK_ElectricianProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentPriceHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CatalogItemId = table.Column<int>(type: "integer", nullable: false),
                    OldPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    NewPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ChangePercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ChangedByAdminId = table.Column<int>(type: "integer", nullable: false),
                    EffectiveDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentPriceHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EquipmentPriceHistories_EquipmentCatalog_CatalogItemId",
                        column: x => x.CatalogItemId,
                        principalTable: "EquipmentCatalog",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EquipmentPriceHistories_Users_ChangedByAdminId",
                        column: x => x.ChangedByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    JobId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    ElectricianId = table.Column<int>(type: "integer", nullable: true),
                    JobType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    VoiceNoteUrl = table.Column<string>(type: "text", nullable: false),
                    LocationLat = table.Column<double>(type: "double precision", nullable: false),
                    LocationLng = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    StartOTP = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FinalApprovalOTP = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsEmergency = table.Column<bool>(type: "boolean", nullable: false),
                    ConcurrencyVersion = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    AssignedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledByUserId = table.Column<int>(type: "integer", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisputeReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisputeResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisputeResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AgreedLabourAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AgreedLabourAmountSetByAdminId = table.Column<int>(type: "integer", nullable: true),
                    AgreedLabourAmountSetAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AgreedLabourNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.JobId);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_AgreedLabourAmountSetByAdminId",
                        column: x => x.AgreedLabourAmountSetByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_AssignedByAdminId",
                        column: x => x.AssignedByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_ElectricianId",
                        column: x => x.ElectricianId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RelatedJobId = table.Column<int>(type: "integer", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimulatorResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ElectricianId = table.Column<int>(type: "integer", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false),
                    TimeTakenSeconds = table.Column<int>(type: "integer", nullable: false),
                    SafetyMistakesCount = table.Column<int>(type: "integer", nullable: false),
                    CorrectConnections = table.Column<int>(type: "integer", nullable: false),
                    TaskConfigurationJson = table.Column<string>(type: "text", nullable: false),
                    TaskIds = table.Column<string>(type: "text", nullable: false),
                    IsPassed = table.Column<bool>(type: "boolean", nullable: false),
                    AttemptDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulatorResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimulatorResults_Users_ElectricianId",
                        column: x => x.ElectricianId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TechnicianAuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ElectricianProfileId = table.Column<int>(type: "integer", nullable: false),
                    AdminId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NewStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TechnicianAuditLogs_ElectricianProfiles_ElectricianProfileId",
                        column: x => x.ElectricianProfileId,
                        principalTable: "ElectricianProfiles",
                        principalColumn: "ProfileId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TechnicianAuditLogs_Users_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TechnicianPayoutRecords",
                columns: table => new
                {
                    PayoutId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ElectricianProfileId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AccountNumberMasked = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    BankTransferReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RecordedByAdminId = table.Column<int>(type: "integer", nullable: false),
                    DisbursedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AdminNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsReversed = table.Column<bool>(type: "boolean", nullable: false),
                    ReversedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReversalReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReversalTransactionId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianPayoutRecords", x => x.PayoutId);
                    table.ForeignKey(
                        name: "FK_TechnicianPayoutRecords_ElectricianProfiles_ElectricianProf~",
                        column: x => x.ElectricianProfileId,
                        principalTable: "ElectricianProfiles",
                        principalColumn: "ProfileId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TechnicianPayoutRecords_Users_RecordedByAdminId",
                        column: x => x.RecordedByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobAgreedLabourAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    PreviousAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    NewAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AdminId = table.Column<int>(type: "integer", nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobAgreedLabourAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobAgreedLabourAudits_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobAgreedLabourAudits_Users_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobBids",
                columns: table => new
                {
                    BidId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    ElectricianId = table.Column<int>(type: "integer", nullable: false),
                    EstimatedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobBids", x => x.BidId);
                    table.ForeignKey(
                        name: "FK_JobBids_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobBids_Users_ElectricianId",
                        column: x => x.ElectricianId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobUsedEquipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    CatalogItemId = table.Column<int>(type: "integer", nullable: true),
                    ItemName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ClaimedPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    VariancePercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    ReceiptImageUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Legacy"),
                    AdminReviewNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReviewedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobUsedEquipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobUsedEquipments_EquipmentCatalog_CatalogItemId",
                        column: x => x.CatalogItemId,
                        principalTable: "EquipmentCatalog",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_JobUsedEquipments_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_JobUsedEquipments_Users_ReviewedByAdminId",
                        column: x => x.ReviewedByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTransactions",
                columns: table => new
                {
                    TransactionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PlatformCommission = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ElectricianEarning = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransactions", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    ReviewId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    ElectricianId = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.ReviewId);
                    table.ForeignKey(
                        name: "FK_Reviews_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_ElectricianId",
                        column: x => x.ElectricianId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    TransactionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ElectricianProfileId = table.Column<int>(type: "integer", nullable: false),
                    JobId = table.Column<int>(type: "integer", nullable: true),
                    PaymentTransactionId = table.Column<int>(type: "integer", nullable: true),
                    PayoutRecordId = table.Column<int>(type: "integer", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CommissionDebtBefore = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CommissionDebtAfter = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CommissionDebtRecovered = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TransactionType = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    InitiatedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    ExternalReferenceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_ElectricianProfiles_ElectricianProfileId",
                        column: x => x.ElectricianProfileId,
                        principalTable: "ElectricianProfiles",
                        principalColumn: "ProfileId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_PaymentTransactions_PaymentTransactionId",
                        column: x => x.PaymentTransactionId,
                        principalTable: "PaymentTransactions",
                        principalColumn: "TransactionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_TechnicianPayoutRecords_PayoutRecordId",
                        column: x => x.PayoutRecordId,
                        principalTable: "TechnicianPayoutRecords",
                        principalColumn: "PayoutId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Users_InitiatedByAdminId",
                        column: x => x.InitiatedByAdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_ActionType",
                table: "AdminAuditLogs",
                column: "ActionType");

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_AdminUserId",
                table: "AdminAuditLogs",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_CreatedAtUtc",
                table: "AdminAuditLogs",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_EntityType_EntityId",
                table: "AdminAuditLogs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_ElectricianProfiles_UserId",
                table: "ElectricianProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentCatalog_Category",
                table: "EquipmentCatalog",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentCatalog_IsActive",
                table: "EquipmentCatalog",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentPriceHistories_CatalogItemId",
                table: "EquipmentPriceHistories",
                column: "CatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentPriceHistories_ChangedByAdminId",
                table: "EquipmentPriceHistories",
                column: "ChangedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentPriceHistories_EffectiveDateUtc",
                table: "EquipmentPriceHistories",
                column: "EffectiveDateUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobAgreedLabourAudits_AdminId",
                table: "JobAgreedLabourAudits",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_JobAgreedLabourAudits_ChangedAtUtc",
                table: "JobAgreedLabourAudits",
                column: "ChangedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobAgreedLabourAudits_JobId",
                table: "JobAgreedLabourAudits",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_JobBids_ElectricianId",
                table: "JobBids",
                column: "ElectricianId");

            migrationBuilder.CreateIndex(
                name: "IX_JobBids_JobId",
                table: "JobBids",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_AgreedLabourAmountSetByAdminId",
                table: "Jobs",
                column: "AgreedLabourAmountSetByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_AssignedByAdminId",
                table: "Jobs",
                column: "AssignedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_CancelledByUserId",
                table: "Jobs",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_CustomerId",
                table: "Jobs",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_ElectricianId",
                table: "Jobs",
                column: "ElectricianId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_IsEmergency",
                table: "Jobs",
                column: "IsEmergency");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_JobType",
                table: "Jobs",
                column: "JobType");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Status",
                table: "Jobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_CatalogItemId",
                table: "JobUsedEquipments",
                column: "CatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_JobId",
                table: "JobUsedEquipments",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_JobId_CatalogItemId",
                table: "JobUsedEquipments",
                columns: new[] { "JobId", "CatalogItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_ReviewedByAdminId",
                table: "JobUsedEquipments",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_JobId",
                table: "PaymentTransactions",
                column: "JobId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ElectricianId",
                table: "Reviews",
                column: "ElectricianId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_JobId",
                table: "Reviews",
                column: "JobId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulatorResults_ElectricianId",
                table: "SimulatorResults",
                column: "ElectricianId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianAuditLogs_AdminId",
                table: "TechnicianAuditLogs",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianAuditLogs_ElectricianProfileId",
                table: "TechnicianAuditLogs",
                column: "ElectricianProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianPayoutRecords_DisbursedAtUtc",
                table: "TechnicianPayoutRecords",
                column: "DisbursedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianPayoutRecords_ElectricianProfileId",
                table: "TechnicianPayoutRecords",
                column: "ElectricianProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_TechnicianPayoutRecords_RecordedByAdminId",
                table: "TechnicianPayoutRecords",
                column: "RecordedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_AccountStatus",
                table: "Users",
                column: "AccountStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_CreatedAtUtc",
                table: "WalletTransactions",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_ElectricianProfileId",
                table: "WalletTransactions",
                column: "ElectricianProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_InitiatedByAdminId",
                table: "WalletTransactions",
                column: "InitiatedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_JobId",
                table: "WalletTransactions",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_PaymentTransactionId",
                table: "WalletTransactions",
                column: "PaymentTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_PaymentTransactionId_TransactionType",
                table: "WalletTransactions",
                columns: new[] { "PaymentTransactionId", "TransactionType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_PayoutRecordId",
                table: "WalletTransactions",
                column: "PayoutRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_TransactionType",
                table: "WalletTransactions",
                column: "TransactionType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminAuditLogs");

            migrationBuilder.DropTable(
                name: "EquipmentPriceHistories");

            migrationBuilder.DropTable(
                name: "JobAgreedLabourAudits");

            migrationBuilder.DropTable(
                name: "JobBids");

            migrationBuilder.DropTable(
                name: "JobUsedEquipments");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "SimulatorResults");

            migrationBuilder.DropTable(
                name: "TechnicianAuditLogs");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "EquipmentCatalog");

            migrationBuilder.DropTable(
                name: "PaymentTransactions");

            migrationBuilder.DropTable(
                name: "TechnicianPayoutRecords");

            migrationBuilder.DropTable(
                name: "Jobs");

            migrationBuilder.DropTable(
                name: "ElectricianProfiles");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
