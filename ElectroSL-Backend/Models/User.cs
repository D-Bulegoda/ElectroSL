using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class User
{
    [Key]
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer"; // Customer, Electrician, Admin
    public string Phone { get; set; } = string.Empty;
    public bool IsPhoneVerified { get; set; } = false;
    public string? OtpCodeHash { get; set; }
    public DateTime? OtpExpiryUtc { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ElectricianProfile? ElectricianProfile { get; set; }
    public ICollection<Job> CustomerJobs { get; set; } = new List<Job>();
    public ICollection<Job> AssignedJobs { get; set; } = new List<Job>();
    public ICollection<JobBid> JobBids { get; set; } = new List<JobBid>();
    public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public ICollection<SimulatorResult> SimulatorResults { get; set; } = new List<SimulatorResult>();
}
