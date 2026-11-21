namespace ElectroSL_Backend.DTOs.Admin;

public enum JobActionStatus
{
    Success,
    NotFound,
    Conflict,
    Invalid
}

public class JobActionResult<T>
{
    public JobActionStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public static JobActionResult<T> Ok(T data, string message) =>
        new() { Status = JobActionStatus.Success, Data = data, Message = message };

    public static JobActionResult<T> NotFound(string message) =>
        new() { Status = JobActionStatus.NotFound, Message = message };

    public static JobActionResult<T> Conflict(string message) =>
        new() { Status = JobActionStatus.Conflict, Message = message };

    public static JobActionResult<T> Invalid(string message) =>
        new() { Status = JobActionStatus.Invalid, Message = message };
}

