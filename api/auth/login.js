const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Log the incoming request for debugging
  console.log('🔍 Vercel Function Called:');
  console.log('  Method:', req.method);
  console.log('  URL:', req.url);
  console.log('  Headers:', req.headers);
  console.log('  Body:', req.body);

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Language, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Only allow POST for login
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  const API_URL = 'http://77.93.153.146:6365/api/Auth/login';
  
  try {
    console.log('🔑 Proxying login request to:', API_URL);
    console.log('📦 Request body:', req.body);
    
    // Make the API call to your .NET backend
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('📡 Backend response status:', response.status);
    console.log('📡 Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    // Parse the response
    const data = await response.json();
    console.log('📋 Backend response data:', data);
    
    // Forward the exact response from your backend
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Proxy error:', error);
    return res.status(500).json({
      isSuccess: false,
      message: 'Proxy server error: ' + error.message,
      errors: [error.message],
      debug: {
        timestamp: new Date().toISOString(),
        apiUrl: API_URL
      }
    });
  }
};
