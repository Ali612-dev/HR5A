// Vercel serverless function to proxy HTTP API calls
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_BASE = 'http://77.93.153.146:6365';
  
  try {
    // Get the target path from query parameter
    const { path } = req.query;
    const targetUrl = `${API_BASE}${path}`;
    
    console.log('Proxying request to:', targetUrl);
    
    // Forward the request to your HTTP API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers['accept-language'] && { 'Accept-Language': req.headers['accept-language'] }),
        ...(req.headers['authorization'] && { 'Authorization': req.headers['authorization'] })
      },
      ...(req.method !== 'GET' && { body: JSON.stringify(req.body) })
    });
    
    const data = await response.json();
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      isSuccess: false,
      message: 'Proxy error: ' + error.message
    });
  }
}
