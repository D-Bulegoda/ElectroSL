namespace ElectroSL_Backend.DTOs.Job;

public enum ClaimSubmissionStatus
{
    Success,
    NotFound,
    Forbidden,
    Invalid,
    Duplicate
}

public class EquipmentClaimSubmissionResult
{
    public ClaimSubmissionStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<EquipmentClaimResponseDto> Claims { get; set; } = new();
    public int AutoApprovedCount { get; set; }
    public int FlaggedCount { get; set; }

    public static EquipmentClaimSubmissionResult Ok(List<EquipmentClaimResponseDto> claims, string message = "") => new()
    {
        Status = ClaimSubmissionStatus.Success,
        Message = message,
        Claims = claims,
        AutoApprovedCount = claims.Count(c => c.Status == "AutoApproved"),
        FlaggedCount = claims.Count(c => c.Status == "FlaggedForReview")
    };

    public static EquipmentClaimSubmissionResult NotFound(string message) => new()
    {
        Status = ClaimSubmissionStatus.NotFound,
        Message = message
    };

    public static EquipmentClaimSubmissionResult Forbidden(string message) => new()
    {
        Status = ClaimSubmissionStatus.Forbidden,
        Message = message
    };

    public static EquipmentClaimSubmissionResult Invalid(string message) => new()
    {
        Status = ClaimSubmissionStatus.Invalid,
        Message = message
    };

    public static EquipmentClaimSubmissionResult Duplicate(string message) => new()
    {
        Status = ClaimSubmissionStatus.Duplicate,
        Message = message
    };
}

