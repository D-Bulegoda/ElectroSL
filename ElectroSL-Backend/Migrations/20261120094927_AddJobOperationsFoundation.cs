using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddJobOperationsFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AssignedAt",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AssignedByAdminId",
                table: "Jobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Jobs",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CancelledByUserId",
                table: "Jobs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConcurrencyVersion",
                table: "Jobs",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "DisputeReason",
                table: "Jobs",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "DisputeResolutionNotes",
                table: "Jobs",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "DisputeResolvedAt",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_AssignedByAdminId",
                table: "Jobs",
                column: "AssignedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_CancelledByUserId",
                table: "Jobs",
                column: "CancelledByUserId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Users_AssignedByAdminId",
                table: "Jobs",
                column: "AssignedByAdminId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Users_CancelledByUserId",
                table: "Jobs",
                column: "CancelledByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Users_AssignedByAdminId",
                table: "Jobs");

            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Users_CancelledByUserId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_AssignedByAdminId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_CancelledByUserId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_IsEmergency",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_JobType",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_Status",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AssignedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "AssignedByAdminId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CancelledByUserId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ConcurrencyVersion",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DisputeReason",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DisputeResolutionNotes",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DisputeResolvedAt",
                table: "Jobs");
        }
    }
}
