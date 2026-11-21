namespace ElectroSL_Backend.DTOs.Admin;

public enum UserResultStatus
{
    Success,
    NotFound,
    Conflict,
    Invalid
}

public class UserActionResult<T>
{
    public UserResultStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public static UserActionResult<T> Ok(T data, string message) =>
        new() { Status = UserResultStatus.Success, Data = data, Message = message };

    public static UserActionResult<T> NotFound(string message) =>
        new() { Status = UserResultStatus.NotFound, Message = message };

    public static UserActionResult<T> Conflict(string message) =>
        new() { Status = UserResultStatus.Conflict, Message = message };

    public static UserActionResult<T> Invalid(string message) =>
        new() { Status = UserResultStatus.Invalid, Message = message };
}

