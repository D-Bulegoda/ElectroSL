namespace ElectroSL_Backend.Utilities;

public class AccountStatusException : Exception
{
    public string Status { get; }
    public string? Reason { get; }

    public AccountStatusException(string status, string? reason, string message) : base(message)
    {
        Status = status;
        Reason = reason;
    }
}

