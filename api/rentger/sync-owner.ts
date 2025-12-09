import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENTGER_API_KEY = process.env.RENTGER_API_KEY;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
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
    const { name, email, phone, dni } = req.body;

    // Validación de campos requeridos
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre y email son requeridos.' 
      });
    }

    // Primero intentamos buscar si la persona ya existe por email
    const searchResponse = await fetch(`${RENTGER_API_BASE}/people?email=${encodeURIComponent(email)}&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENTGER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let rentgerId = null;

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.results && searchData.results.length > 0) {
        // La persona existe, actualizamos
        rentgerId = searchData.results[0].id;
        
        const updateResponse = await fetch(`${RENTGER_API_BASE}/people/${rentgerId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${RENTGER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone || '',
            id_number: dni || '',
          }),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Rentger update person error:', errorText);
        }

        return res.status(200).json({ 
          success: true, 
          rentgerId, 
          action: 'updated' 
        });
      }
    }

    // Si no existe, creamos nueva persona
    const createResponse = await fetch(`${RENTGER_API_BASE}/people`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENTGER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone || '',
        id_number: dni || '',
        kind: 'owner', // Tipo: propietario
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Rentger create person error:', errorText);
      return res.status(createResponse.status).json({ 
        success: false, 
        error: `Error creando persona en Rentger: ${createResponse.status}` 
      });
    }

    const createData = await createResponse.json();
    rentgerId = createData.id;

    return res.status(200).json({ 
      success: true, 
      rentgerId, 
      action: 'created',
      data: createData 
    });

  } catch (error: any) {
    console.error('Sync Owner failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error sincronizando propietario' 
    });
  }
}
