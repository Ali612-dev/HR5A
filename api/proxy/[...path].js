// Vercel API Route: /api/proxy/[...path].js
export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  const API_BASE_URL = 'http://77.93.153.146:6365';
  
  try {
    // Extract path from dynamic route parameters
    const { path: pathSegments } = req.query;
    
    // Handle path segments - could be string or array
    let apiPath;
    if (Array.isArray(pathSegments)) {
      apiPath = pathSegments.join('/');
    } else if (typeof pathSegments === 'string') {
      apiPath = pathSegments;
    } else {
      throw new Error('Invalid path parameter');
    }
    
    // Construct target URL
    const targetUrl = `${API_BASE_URL}/api/${apiPath}`;
    
    console.log('🔗 Proxying request:');
    console.log('  Method:', req.method);
    console.log('  Target URL:', targetUrl);
    console.log('  Original URL:', req.url);
    console.log('  Query:', req.query);
    console.log('  Body:', req.body);
    
    // Build fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add Accept-Language if available
    if (req.headers['accept-language']) {
      fetchOptions.headers['Accept-Language'] = req.headers['accept-language'];
    }

    // Add Authorization if present
    if (req.headers['authorization']) {
      fetchOptions.headers['Authorization'] = req.headers['authorization'];
    }

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    console.log('🚀 Fetch options:', JSON.stringify(fetchOptions, null, 2));
    
    // Make the API call
    const apiResponse = await fetch(targetUrl, fetchOptions);
    
    console.log('📡 API Response:');
    console.log('  Status:', apiResponse.status);
    console.log('  Status Text:', apiResponse.statusText);
    console.log('  Headers:', Object.fromEntries(apiResponse.headers.entries()));
    
    // Parse response
    const contentType = apiResponse.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await apiResponse.json();
    } else {
      const textData = await apiResponse.text();
      responseData = { message: textData };
    }
    
    console.log('📋 Response data:', responseData);
    
    // Return response with same status as API
    return res.status(apiResponse.status).json(responseData);
    
  } catch (error) {
    console.error('🚨 Proxy error:', error);
    
    // Return error response
    return res.status(500).json({
      isSuccess: false,
      message: `Proxy error: ${error.message}`,
      errors: [error.message],
      debug: {
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
}
