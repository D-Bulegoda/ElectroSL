using ElectroSL_Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EquipmentCatalogController : ControllerBase
{
    private readonly ElectroSLDbContext _context;

    public EquipmentCatalogController(ElectroSLDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetStandardPrices([FromQuery] string? category, [FromQuery] string? search)
    {
        // Strictly return only active items: inactive/archived items cannot be selected for new jobs
        var query = _context.EquipmentCatalog
            .Where(c => c.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c => 
                c.ItemName.ToLower().Contains(s) || 
                c.BrandName.ToLower().Contains(s) || 
                c.Specification.ToLower().Contains(s) ||
                (c.Description != null && c.Description.ToLower().Contains(s)));
        }

        var items = await query
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .Select(c => new
            {
                c.ItemId,
                ItemName = !string.IsNullOrWhiteSpace(c.ItemName) ? c.ItemName : (c.BrandName + " " + c.Specification).Trim(),
                c.Description,
                c.Category,
                c.BrandName,
                c.Specification,
                c.Unit,
                c.StandardMarketPrice,
                c.PriceVarianceThreshold,
                c.LastUpdated
            })
            .ToListAsync();

        return Ok(items);
    }
}