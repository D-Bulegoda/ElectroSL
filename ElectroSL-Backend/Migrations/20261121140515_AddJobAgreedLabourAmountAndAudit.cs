using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddJobAgreedLabourAmountAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AgreedLabourAmount",
                table: "Jobs",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AgreedLabourAmountSetAtUtc",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AgreedLabourAmountSetByAdminId",
                table: "Jobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgreedLabourNotes",
                table: "Jobs",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "JobAgreedLabourAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    JobId = table.Column<int>(type: "int", nullable: false),
                    PreviousAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NewAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AdminId = table.Column<int>(type: "int", nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_AgreedLabourAmountSetByAdminId",
                table: "Jobs",
                column: "AgreedLabourAmountSetByAdminId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Users_AgreedLabourAmountSetByAdminId",
                table: "Jobs",
                column: "AgreedLabourAmountSetByAdminId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Users_AgreedLabourAmountSetByAdminId",
                table: "Jobs");

            migrationBuilder.DropTable(
                name: "JobAgreedLabourAudits");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_AgreedLabourAmountSetByAdminId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AgreedLabourAmount",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AgreedLabourAmountSetAtUtc",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AgreedLabourAmountSetByAdminId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AgreedLabourNotes",
                table: "Jobs");
        }
    }
}
