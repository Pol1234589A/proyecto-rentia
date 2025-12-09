const RENTGER_API_KEY = process.env.RENTGER_API_KEY;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

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
    const { imageBase64, personId, fileName } = req.body;

    // Validación
    if (!imageBase64 || !personId || !fileName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos para subir la firma (imageBase64, personId, fileName).' 
      });
    }

    // Construir payload para subir documento
    const payload = {
      name: fileName,
      file: imageBase64, // La API de Rentger espera el base64 raw
      person_id: personId,
      document_type: 'signature', // Tipo de documento
      description: 'Firma RGPD - Consentimiento de tratamiento de datos',
    };

    // Subir documento a Rentger
    const uploadResponse = await fetch(`${RENTGER_API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'rentger-key': RENTGER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Rentger upload document error:', errorText);
      return res.status(uploadResponse.status).json({ 
        success: false, 
        error: `Error subiendo documento a Rentger: ${uploadResponse.status}` 
      });
    }

    const uploadData = await uploadResponse.json();
    
    return res.status(200).json({ 
      success: true, 
      documentId: uploadData.id,
      data: uploadData 
    });

  } catch (error: any) {
    console.error('Upload Signature failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error subiendo firma' 
    });
  }
}
