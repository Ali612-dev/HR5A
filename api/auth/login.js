export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Language');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST for login
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const API_URL = 'http://77.93.153.146:6365/api/Auth/login';
  
  try {
    console.log('🔑 Login proxy - Body:', req.body);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('📡 Login API response:', data);
    
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Login proxy error:', error);
    return res.status(500).json({
      isSuccess: false,
      message: 'Server connection failed',
      errors: [error.message]
    });
  }
}
