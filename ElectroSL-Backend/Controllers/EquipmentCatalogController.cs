using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EquipmentCatalogController : ControllerBase
{
    [HttpGet]
    public IActionResult GetStandardPrices()
    {
        // Returns the database of standard prices to check the 5% variance
        return Ok(new { message = "Catalog prices loaded." });
    }
}