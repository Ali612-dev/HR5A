export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_BASE_URL = 'http://77.93.153.146:6365';
  
  try {
    // Get the API path from the query
    const { path, ...params } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
    // Construct the target URL
    const targetUrl = `${API_BASE_URL}/api/${apiPath}`;
    
    console.log('🔗 Proxying request to:', targetUrl);
    console.log('📦 Method:', req.method);
    console.log('📋 Body:', req.body);
    
    // Forward the request to the actual API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': req.headers['accept-language'] || 'en-US',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: JSON.stringify(req.body) })
    });
    
    const data = await response.json();
    
    console.log('📡 API Response Status:', response.status);
    console.log('📄 API Response Data:', data);
    
    // Forward the response
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Proxy Error:', error);
    res.status(500).json({ 
      isSuccess: false, 
      message: 'Proxy server error: ' + error.message,
      errors: [error.message]
    });
  }
}
