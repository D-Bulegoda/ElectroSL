using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Electrician;

public class UpdateLocationDto
{
    public int UserId { get; set; }

    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90.")]
    public double Lat { get; set; }

    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180.")]
    public double Lng { get; set; }
}