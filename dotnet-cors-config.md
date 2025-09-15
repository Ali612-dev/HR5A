# .NET CORS Configuration for Vercel Frontend

## Option 1: For .NET Core (Startup.cs or Program.cs)

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowVercelOrigin", builder =>
        {
            builder
                .WithOrigins(
                    "https://hr-5-a.vercel.app",
                    "http://localhost:4200",
                    "https://*.vercel.app"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });

    // Add other services...
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // Enable CORS
    app.UseCors("AllowVercelOrigin");
    
    // Other middleware...
}
```

## Option 2: For .NET Framework (web.config)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="https://hr-5-a.vercel.app" />
        <add name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type, Authorization, Accept-Language" />
        <add name="Access-Control-Allow-Credentials" value="true" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

## Option 3: Global CORS (Less Secure - For Testing Only)

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

## Option 4: Controller Level CORS

```csharp
[EnableCors("AllowVercelOrigin")]
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    [HttpOptions("login")] // Handle preflight requests
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Your login logic
    }
}
```

**Recommended**: Use Option 1 with specific origins for production security.
