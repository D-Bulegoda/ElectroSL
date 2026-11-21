using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectroSL_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintToJobUsedEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Pre-migration safety validation:
            // Verify there are no existing duplicate (JobId, CatalogItemId) claims where CatalogItemId IS NOT NULL.
            // If duplicates exist, halt migration with a descriptive error so an administrator or DBA can review
            // and resolve them manually, without destroying historical catalog references or deleting data.
            migrationBuilder.Sql(@"
                DROP PROCEDURE IF EXISTS ValidateNoDuplicateJobEquipment;
            ");

            migrationBuilder.Sql(@"
                CREATE PROCEDURE ValidateNoDuplicateJobEquipment()
                BEGIN
                    DECLARE duplicate_count INT DEFAULT 0;

                    SELECT COUNT(*) INTO duplicate_count
                    FROM (
                        SELECT JobId, CatalogItemId
                        FROM JobUsedEquipments
                        WHERE CatalogItemId IS NOT NULL
                        GROUP BY JobId, CatalogItemId
                        HAVING COUNT(*) > 1
                    ) AS duplicates;

                    IF duplicate_count > 0 THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'Migration AddUniqueConstraintToJobUsedEquipment aborted: Duplicate (JobId, CatalogItemId) records exist in JobUsedEquipments. To prevent data loss and preserve catalog relationships, please manually inspect and resolve duplicate claims before applying the unique index.';
                    END IF;
                END;
            ");

            migrationBuilder.Sql(@"
                CALL ValidateNoDuplicateJobEquipment();
            ");

            migrationBuilder.Sql(@"
                DROP PROCEDURE IF EXISTS ValidateNoDuplicateJobEquipment;
            ");

            // Apply unique index on (JobId, CatalogItemId).
            // Under MySQL and standard SQL semantics, multiple rows with CatalogItemId = NULL are allowed.
            migrationBuilder.CreateIndex(
                name: "IX_JobUsedEquipments_JobId_CatalogItemId",
                table: "JobUsedEquipments",
                columns: new[] { "JobId", "CatalogItemId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobUsedEquipments_JobId_CatalogItemId",
                table: "JobUsedEquipments");
        }
    }
}
