using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CustomerController : ControllerBase
{
    [HttpGet("{customerId}/jobs")]
    public IActionResult GetCustomerJobs(int customerId)
    {
        // Fetch all past and active jobs for a specific customer
        return Ok(new { message = $"Returning jobs for customer {customerId}" });
    }

    [HttpPost("{customerId}/review")]
    public IActionResult SubmitReview(int customerId, [FromBody] Models.Review review)
    {
        // Add review rating and recalculate electrician's total rating
        return Ok(new { message = "Review submitted successfully" });
    }
}