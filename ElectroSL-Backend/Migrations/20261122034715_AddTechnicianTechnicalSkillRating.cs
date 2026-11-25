using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicianTechnicalSkillRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TechnicalSkillAssessmentNote",
                table: "ElectricianProfiles",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "TechnicalSkillRatedAtUtc",
                table: "ElectricianProfiles",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TechnicalSkillRatedByAdminId",
                table: "ElectricianProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TechnicalSkillRating",
                table: "ElectricianProfiles",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TechnicalSkillAssessmentNote",
                table: "ElectricianProfiles");

            migrationBuilder.DropColumn(
                name: "TechnicalSkillRatedAtUtc",
                table: "ElectricianProfiles");

            migrationBuilder.DropColumn(
                name: "TechnicalSkillRatedByAdminId",
                table: "ElectricianProfiles");

            migrationBuilder.DropColumn(
                name: "TechnicalSkillRating",
                table: "ElectricianProfiles");
        }
    }
}
