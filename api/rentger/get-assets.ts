const RENTGER_API_KEY = process.env.RENTGER_API_KEY;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

export default async function handler(req: any, res: any) {
  // Permitir GET y POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar API key
  if (!RENTGER_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: 'La API Key de Rentger no está configurada en el servidor.' 
    });
  }

  try {
    const { limit = 100, offset = 0 } = req.method === 'POST' ? req.body : req.query;

    const response = await fetch(`${RENTGER_API_BASE}/assets?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'rentger-key': RENTGER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rentger get assets error:', errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `Error obteniendo propiedades de Rentger: ${response.status}` 
      });
    }

    const data = await response.json();
    
    return res.status(200).json({ 
      success: true, 
      data: data.results || data,
      total: data.count || (data.results?.length || 0)
    });

  } catch (error: any) {
    console.error('Get Assets failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error obteniendo propiedades' 
    });
  }
}
