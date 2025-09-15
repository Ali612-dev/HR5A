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
    // Get the API path from the dynamic route
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
    // Construct the target URL
    const targetUrl = `${API_BASE_URL}/api/${apiPath}`;
    
    console.log('🔗 Proxying request to:', targetUrl);
    console.log('📦 Method:', req.method);
    console.log('📋 Headers:', req.headers);
    console.log('📄 Body:', req.body);
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': req.headers['accept-language'] || 'en-US',
      }
    };

    // Add authorization header if present
    if (req.headers.authorization) {
      requestOptions.headers['Authorization'] = req.headers.authorization;
    }

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }
    
    console.log('🚀 Request Options:', requestOptions);
    
    // Forward the request to the actual API
    const response = await fetch(targetUrl, requestOptions);
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', response.headers);
    
    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    console.log('📄 API Response Text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If it's not JSON, return as text
      data = { message: responseText };
    }
    
    console.log('📋 Parsed Response Data:', data);
    
    // Forward the response with proper status
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
