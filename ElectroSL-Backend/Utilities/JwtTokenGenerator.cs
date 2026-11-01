namespace ElectroSL_Backend.Utilities;

public static class JwtTokenGenerator
{
    public static string GenerateToken(int userId, string role, string secretKey)
    {
        // Implementation of JWT generation using System.IdentityModel.Tokens.Jwt
        return "sample_jwt_token_string";
    }
}