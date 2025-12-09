import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENTGER_API_KEY = process.env.RENTGER_API_KEY;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que la API key está configurada
  if (!RENTGER_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: 'La API Key de Rentger no está configurada en el servidor.' 
    });
  }

  try {
    // Hacer ping a Rentger para verificar la conexión
    const response = await fetch(`${RENTGER_API_BASE}/assets?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENTGER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rentger API error:', errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `Rentger API Error: ${response.status}` 
      });
    }

    return res.status(200).json({ success: true, message: 'Pong!' });
  } catch (error: any) {
    console.error('Rentger Ping failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error de conexión con Rentger' 
    });
  }
}
