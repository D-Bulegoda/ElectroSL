FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ElectroSL-Backend.csproj", "./"]
RUN dotnet restore "ElectroSL-Backend.csproj"
COPY . .
RUN dotnet publish "ElectroSL-Backend.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "ElectroSL-Backend.dll"]
