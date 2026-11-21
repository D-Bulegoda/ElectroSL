namespace ElectroSL_Backend.DTOs.Admin;

public enum ReviewResultStatus
{
    Success,
    NotFound,
    InvalidPrerequisites,
    Conflict
}

public class ReviewActionResult
{
    public ReviewResultStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CurrentStatus { get; set; }

    public static ReviewActionResult Ok(string message, string? currentStatus = null) =>
        new() { Status = ReviewResultStatus.Success, Message = message, CurrentStatus = currentStatus };

    public static ReviewActionResult NotFound(string message) =>
        new() { Status = ReviewResultStatus.NotFound, Message = message };

    public static ReviewActionResult Invalid(string message) =>
        new() { Status = ReviewResultStatus.InvalidPrerequisites, Message = message };

    public static ReviewActionResult Conflict(string message, string? currentStatus = null) =>
        new() { Status = ReviewResultStatus.Conflict, Message = message, CurrentStatus = currentStatus };
}

