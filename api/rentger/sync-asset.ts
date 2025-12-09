const RENTGER_API_KEY = process.env.RENTGER_API_KEY;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

// Mapeo de tipos de propiedad
const PROPERTY_KIND_MAP: Record<string, number> = {
  'apartment': 1,    // Piso
  'house': 2,        // Casa
  'studio': 3,       // Estudio
  'room': 4,         // Habitación
  'office': 5,       // Oficina
  'commercial': 6,   // Local comercial
  'parking': 7,      // Parking
  'storage': 8,      // Trastero
  'land': 9,         // Terreno
  'building': 10,    // Edificio
  'other': 99,       // Otros
};

export default async function handler(req: any, res: any) {
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
    const { property } = req.body;

    // Validación
    if (!property || !property.address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos de la propiedad son requeridos (al menos address).' 
      });
    }

    // Construir payload para Rentger
    const payload: any = {
      kind_id: PROPERTY_KIND_MAP[property.type] || 1, // Default: Piso
      address: property.address,
      city: property.city || 'Murcia',
      province: property.province || 'Murcia',
      country_code: 'ES',
      postal_code: property.postalCode || property.zipCode || '30001',
    };

    // Campos opcionales
    if (property.name) payload.name = property.name;
    if (property.description) payload.description = property.description;
    if (property.rooms) payload.rooms = property.rooms;
    if (property.bathrooms) payload.bathrooms = property.bathrooms;
    if (property.sqm || property.size) payload.area = property.sqm || property.size;
    if (property.floor) payload.floor = property.floor;
    if (property.ownerId) payload.owner_id = property.ownerId;
    if (property.cadastralRef) payload.cadastral_reference = property.cadastralRef;

    // Si la propiedad ya tiene rentgerId, actualizamos
    if (property.rentgerId) {
      const updateResponse = await fetch(`${RENTGER_API_BASE}/assets/${property.rentgerId}`, {
        method: 'PUT',
        headers: {
          'rentger-key': RENTGER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Rentger update asset error:', errorText);
        return res.status(updateResponse.status).json({ 
          success: false, 
          error: `Error actualizando propiedad en Rentger: ${updateResponse.status}` 
        });
      }

      const updateData = await updateResponse.json();
      return res.status(200).json({ 
        success: true, 
        rentgerId: property.rentgerId,
        action: 'updated',
        data: updateData 
      });
    }

    // Si no tiene rentgerId, creamos nueva
    const createResponse = await fetch(`${RENTGER_API_BASE}/assets`, {
      method: 'POST',
      headers: {
        'rentger-key': RENTGER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Rentger create asset error:', errorText);
      return res.status(createResponse.status).json({ 
        success: false, 
        error: `Error creando propiedad en Rentger: ${createResponse.status}` 
      });
    }

    const createData = await createResponse.json();
    
    return res.status(200).json({ 
      success: true, 
      rentgerId: createData.id,
      action: 'created',
      data: createData 
    });

  } catch (error: any) {
    console.error('Sync Asset failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error sincronizando propiedad' 
    });
  }
}
