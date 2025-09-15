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
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error: ' + error.message,
    });
  }
};
