namespace ElectroSL_Backend.DTOs.Admin;

public enum CatalogResultStatus
{
    Success,
    NotFound,
    Invalid,
    Conflict
}

public class CatalogActionResult<T>
{
    public CatalogResultStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public static CatalogActionResult<T> Ok(T data, string message = "") =>
        new() { Status = CatalogResultStatus.Success, Data = data, Message = message };

    public static CatalogActionResult<T> NotFound(string message) =>
        new() { Status = CatalogResultStatus.NotFound, Message = message };

    public static CatalogActionResult<T> Invalid(string message) =>
        new() { Status = CatalogResultStatus.Invalid, Message = message };

    public static CatalogActionResult<T> Conflict(string message) =>
        new() { Status = CatalogResultStatus.Conflict, Message = message };
}

