# HTTPS Setup for .NET API Server

## Option 1: Quick Fix - Use HTTPS with Self-Signed Certificate (Development)

Update your .NET `Program.cs`:

```csharp
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(6365); // HTTP
    serverOptions.ListenAnyIP(6366, listenOptions =>
    {
        listenOptions.UseHttps(); // HTTPS on port 6366
    });
});
```

Then update the frontend to use: `https://77.93.153.146:6366`

## Option 2: Production HTTPS with SSL Certificate

1. **Get an SSL certificate** for your domain
2. **Configure Kestrel with the certificate**:

```csharp
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(6366, listenOptions =>
    {
        listenOptions.UseHttps("path/to/certificate.pfx", "certificate-password");
    });
});
```

## Option 3: Use a Reverse Proxy (Recommended)

Set up **nginx** or **IIS** as a reverse proxy with SSL:

### Nginx Configuration:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:6365;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Option 4: Temporary Workaround - Use HTTP in Development

For immediate testing, update your environment to use HTTP with a different approach:

```typescript
// In environment.prod.ts - TEMPORARY ONLY
export const environment = {
  production: true,
  apiBaseUrl: 'http://77.93.153.146:6365',
  allowInsecureRequests: true // Flag for development
};
```

But this still won't work due to browser security.

## Recommended Quick Solution:

**Set up HTTPS on port 6366** using Option 1, then update the frontend.
