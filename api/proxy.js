// Vercel serverless function using CommonJS format
module.exports = async (req, res) => {
  console.log('🔍 Proxy function called:');
  console.log('  Method:', req.method);
  console.log('  Query:', req.query);
  console.log('  Body:', req.body);

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight');
    return res.status(200).end();
  }

  const API_BASE = 'http://77.93.153.146:6365';
  
  try {
    // Get the target path from query parameter
    const { path } = req.query;
    
    if (!path) {
      console.log('❌ No path provided');
      return res.status(400).json({
        error: 'Missing path parameter',
        query: req.query
      });
    }

    const targetUrl = `${API_BASE}${path}`;
    console.log('🔗 Proxying request to:', targetUrl);
    console.log('📦 Request method:', req.method);
    console.log('📋 Request body:', req.body);
    
    // Import fetch dynamically (for Node.js compatibility)
    const fetch = (await import('node-fetch')).default;
    
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add Accept-Language if present
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

    console.log('🚀 Fetch options:', fetchOptions);
    
    // Forward the request to your HTTP API
    const response = await fetch(targetUrl, fetchOptions);
    
    console.log('📡 API response status:', response.status);
    
    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
    
    console.log('📋 API response data:', data);
    
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error: ' + error.message,
      details: error.toString()
    });
  }
};
