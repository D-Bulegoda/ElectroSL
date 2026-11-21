using System.Collections.Generic;

namespace ElectroSL_Backend.DTOs.Job;

public enum QueryResultStatus
{
    Success,
    NotFound,
    Forbidden
}

public class EquipmentClaimQueryResult
{
    public QueryResultStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<EquipmentClaimResponseDto> Claims { get; set; } = new();

    public static EquipmentClaimQueryResult Ok(List<EquipmentClaimResponseDto> claims) => new()
    {
        Status = QueryResultStatus.Success,
        Claims = claims
    };

    public static EquipmentClaimQueryResult NotFound(string message) => new()
    {
        Status = QueryResultStatus.NotFound,
        Message = message
    };

    public static EquipmentClaimQueryResult Forbidden(string message) => new()
    {
        Status = QueryResultStatus.Forbidden,
        Message = message
    };
}

