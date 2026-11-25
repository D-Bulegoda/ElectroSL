using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentPriceControlAndHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminReviewNotes",
                table: "JobUsedEquipments",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "JobUsedEquipments",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewedByAdminId",
                table: "JobUsedEquipments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "JobUsedEquipments",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Legacy")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ConcurrencyVersion",
                table: "EquipmentCatalog",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "EquipmentCatalog",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "EquipmentCatalog",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "ItemName",
                table: "EquipmentCatalog",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Populate meaningful ItemName for existing records using BrandName, Specification, and Category
            migrationBuilder.Sql(@"
                UPDATE EquipmentCatalog
                SET ItemName = CASE
                    WHEN TRIM(CONCAT(COALESCE(BrandName, ''), ' ', COALESCE(Specification, ''))) <> ''
                        THEN TRIM(CONCAT(COALESCE(BrandName, ''), ' ', COALESCE(Specification, '')))
                    WHEN COALESCE(Specification, '') <> ''
                        THEN Specification
                    WHEN COALESCE(BrandName, '') <> ''
                        THEN BrandName
                    ELSE COALESCE(Category, 'Electrical Equipment')
                END
                WHERE ItemName IS NULL OR ItemName = '';
            ");

            migrationBuilder.AddColumn<decimal>(
                name: "PriceVarianceThreshold",
                table: "EquipmentCatalog",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 5.00m);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "EquipmentCatalog",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Unit")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "EquipmentPriceHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CatalogItemId = table.Column<int>(type: "int", nullable: false),
                    OldPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NewPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ChangePercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangedByAdminId = table.Column<int>(type: "int", nullable: false),
                    EffectiveDateUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_ReviewedByAdminId",
                table: "JobUsedEquipments",
                column: "ReviewedByAdminId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_JobUsedEquipments_Users_ReviewedByAdminId",
                table: "JobUsedEquipments",
                column: "ReviewedByAdminId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobUsedEquipments_Users_ReviewedByAdminId",
                table: "JobUsedEquipments");

            migrationBuilder.DropTable(
                name: "EquipmentPriceHistories");

            migrationBuilder.DropIndex(
                name: "IX_JobUsedEquipments_ReviewedByAdminId",
                table: "JobUsedEquipments");

            migrationBuilder.DropIndex(
                name: "IX_EquipmentCatalog_Category",
                table: "EquipmentCatalog");

            migrationBuilder.DropIndex(
                name: "IX_EquipmentCatalog_IsActive",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "AdminReviewNotes",
                table: "JobUsedEquipments");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "JobUsedEquipments");

            migrationBuilder.DropColumn(
                name: "ReviewedByAdminId",
                table: "JobUsedEquipments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "JobUsedEquipments");

            migrationBuilder.DropColumn(
                name: "ConcurrencyVersion",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "ItemName",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "PriceVarianceThreshold",
                table: "EquipmentCatalog");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "EquipmentCatalog");
        }
    }
}
