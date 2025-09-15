const fetch = require('node-fetch');

module.exports = async (req, res) => {
  console.log('🔍 Vercel Proxy Function Called');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_BASE = 'http://77.93.153.146:6365';
  
  try {
    const { path } = req.query;
    
    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const targetUrl = `${API_BASE}${path}`;
    console.log('Target URL:', targetUrl);

    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (req.headers['accept-language']) {
      options.headers['Accept-Language'] = req.headers['accept-language'];
    }

    if (req.headers['authorization']) {
      options.headers['Authorization'] = req.headers['authorization'];
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    console.log('Fetch options:', options);

    const response = await fetch(targetUrl, options);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle different content types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // If it's not JSON, wrap it in a standard error format
      data = {
        isSuccess: false,
        message: text || `HTTP ${response.status} ${response.statusText}`,
        errors: [text || `Server returned ${response.status}`]
      };
    }

    console.log('Response data:', data);

    // Always return the data with the original status code
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('🚨 Proxy catch error:', error);
    return res.status(500).json({
      isSuccess: false,
      message: 'Proxy connection failed: ' + error.message,
      errors: [error.message],
      debug: {
        originalError: error.toString(),
        targetUrl: `${API_BASE}${req.query.path}`
      }
    });
  }
};
