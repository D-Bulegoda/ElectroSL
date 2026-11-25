namespace ElectroSL_Backend.DTOs.Admin;

public enum ClaimReviewStatus
{
    Success,
    NotFound,
    Invalid,
    Conflict
}

public class ClaimReviewActionResult
{
    public ClaimReviewStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CurrentStatus { get; set; }
    public int ClaimId { get; set; }

    public static ClaimReviewActionResult Ok(int claimId, string currentStatus, string message) => new()
    {
        Status = ClaimReviewStatus.Success,
        ClaimId = claimId,
        CurrentStatus = currentStatus,
        Message = message
    };

    public static ClaimReviewActionResult NotFound(string message) => new()
    {
        Status = ClaimReviewStatus.NotFound,
        Message = message
    };

    public static ClaimReviewActionResult Invalid(string message) => new()
    {
        Status = ClaimReviewStatus.Invalid,
        Message = message
    };

    public static ClaimReviewActionResult Conflict(string message, string? currentStatus = null) => new()
    {
        Status = ClaimReviewStatus.Conflict,
        CurrentStatus = currentStatus,
        Message = message
    };
}
