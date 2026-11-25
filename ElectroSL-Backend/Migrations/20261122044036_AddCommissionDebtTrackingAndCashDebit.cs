using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionDebtTrackingAndCashDebit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CommissionDebtAfter",
                table: "WalletTransactions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionDebtBefore",
                table: "WalletTransactions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionDebtRecovered",
                table: "WalletTransactions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsReversed",
                table: "TechnicianPayoutRecords",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReversalReason",
                table: "TechnicianPayoutRecords",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "ReversalTransactionId",
                table: "TechnicianPayoutRecords",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReversedAtUtc",
                table: "TechnicianPayoutRecords",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OutstandingCommissionDebt",
                table: "ElectricianProfiles",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommissionDebtAfter",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "CommissionDebtBefore",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "CommissionDebtRecovered",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "IsReversed",
                table: "TechnicianPayoutRecords");

            migrationBuilder.DropColumn(
                name: "ReversalReason",
                table: "TechnicianPayoutRecords");

            migrationBuilder.DropColumn(
                name: "ReversalTransactionId",
                table: "TechnicianPayoutRecords");

            migrationBuilder.DropColumn(
                name: "ReversedAtUtc",
                table: "TechnicianPayoutRecords");

            migrationBuilder.DropColumn(
                name: "OutstandingCommissionDebt",
                table: "ElectricianProfiles");
        }
    }
}
