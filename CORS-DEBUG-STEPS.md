# CORS Debug Steps

## 1. Check Your .NET Program.cs File

Replace your CORS configuration with this **more permissive version** for testing:

```csharp
// Replace this section in your Program.cs:
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder
            .AllowAnyOrigin()  // ⚠️ Temporary - allows all origins
            .AllowAnyMethod()  // Allows all HTTP methods
            .AllowAnyHeader(); // Allows all headers
    });
});
```

And in your middleware configuration:

```csharp
var app = builder.Build();

// ✅ CORS must be BEFORE authentication and authorization
app.UseCors(); // Apply the default policy

// ✅ Then your other middleware
app.UseAuthentication();
app.UseAuthorization();
```

## 2. Test the API Directly

Open a new browser tab and go to:
`http://77.93.153.146:6365/api/Auth/login`

You should see a response (even if it's an error about POST method).

## 3. Check Browser Console

1. Open your Vercel app: https://hr-5-a.vercel.app/admin-login
2. Open Developer Tools (F12)
3. Go to Network tab
4. Try to login
5. Look for the login request and check:
   - What status code it returns
   - What error message appears
   - If there are any CORS-related errors

## 4. If Still Not Working - Add Global CORS Headers

Add this middleware in your .NET app (before UseCors):

```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language");
    
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }
    
    await next();
});
```

## 5. Restart Your .NET API Server

After making these changes, restart your .NET API server completely.

## 6. Test Again

Try the login from Vercel again.
