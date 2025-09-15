// Replace your existing CORS configuration in Program.cs with this:

// Add CORS services with more permissive settings
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVercel", builder =>
    {
        builder
            .WithOrigins(
                "https://hr-5-a.vercel.app",
                "http://localhost:4200",
                "https://*.vercel.app" // Allow all Vercel subdomains
            )
            .SetIsOriginAllowedToAllowWildcardSubdomains()
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("*"); // Expose all headers
    });

    // Add a fallback policy for testing
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// In your middleware configuration, make sure CORS is before authentication:
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseCors("AllowAll"); // Use permissive policy in development
}
else
{
    app.UseCors("AllowVercel"); // Use specific policy in production
}

// ✅ Add localization middleware
app.UseRequestLocalization();

app.UseSwagger(c =>
{
    c.PreSerializeFilters.Add((swagger, httpReq) =>
    {
        var serverUrl = $"{httpReq.Scheme}://{httpReq.Host.Value}";
        swagger.Servers = new List<OpenApiServer> { new() { Url = serverUrl } };
    });
});

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Custom Attendance API V1");
    c.RoutePrefix = "swagger";
});

app.UseStaticFiles();
app.UseRouting();

// ⚠️ IMPORTANT: DO NOT call app.UseCors() again here since we called it above

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

// ... rest of your middleware
