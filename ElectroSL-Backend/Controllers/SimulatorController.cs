using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulatorController : ControllerBase
    {
        private readonly ElectroSLDbContext _context;
        public SimulatorController(ElectroSLDbContext context)
        {
            _context = context;
        }

        [HttpPost("evaluate")]
        public async Task<IActionResult> EvaluateSimulatorTask([FromBody] SimulatorSubmissionDto dto)
        {
            var result = new SimulatorResult
            {
                ElectricianId = dto.ElectricianId,
                Score = dto.Score,
                IsPassed = dto.IsPassed,
                // Note: Ensure your SimulatorResult model has a property named TaskConfigurationJson
                TaskConfigurationJson = dto.ConfigurationJson, 
                CompletedAtUtc = DateTime.UtcNow
            };

            _context.SimulatorResults.Add(result);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, resultId = result.Id, message = "Assessment stored" });
        }
    }

    public class SimulatorSubmissionDto
    {
        public int ElectricianId { get; set; }
        public decimal Score { get; set; }
        public bool IsPassed { get; set; }
        public string TaskId { get; set; } = string.Empty;
        public string ConfigurationJson { get; set; } = string.Empty;
    }
}