using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminFinancialLedgerAndPayouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TechnicianPayoutRecords",
                columns: table => new
                {
                    PayoutId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ElectricianProfileId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AccountNumberMasked = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BankTransferReference = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecordedByAdminId = table.Column<int>(type: "int", nullable: false),
                    DisbursedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AdminNotes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicianPayoutRecords", x => x.PayoutId);
                    table.ForeignKey(
                        name: "FK_TechnicianPayoutRecords_ElectricianProfiles_ElectricianProfi~",
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    TransactionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ElectricianProfileId = table.Column<int>(type: "int", nullable: false),
                    JobId = table.Column<int>(type: "int", nullable: true),
                    PaymentTransactionId = table.Column<int>(type: "int", nullable: true),
                    PayoutRecordId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TransactionType = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InitiatedByAdminId = table.Column<int>(type: "int", nullable: true),
                    ExternalReferenceNumber = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "TechnicianPayoutRecords");
        }
    }
}
