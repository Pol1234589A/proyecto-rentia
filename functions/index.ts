
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

// Inicializa Firebase Admin para poder acceder a otros servicios si fuera necesario
admin.initializeApp();

// --- CONFIGURACIÓN DE SEGURIDAD ---
// Obtiene la API key de Rentger de las variables de entorno seguras de Firebase.
// ¡NUNCA escribas la clave directamente aquí!
const RENTGER_API_KEY = functions.config().rentger?.apikey;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";

// --- HELPERS ---

/**
 * Función para estandarizar las llamadas a la API de Rentger.
 * Incluye automáticamente la autenticación.
 */
const rentgerApiCall = async (endpoint: string, method: "GET" | "POST" | "PUT", body?: object) => {
  const options: { method: string; headers: any; body?: string } = {
    method: method,
    headers: {
      "Authorization": `Bearer ${RENTGER_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${RENTGER_API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new functions.https.HttpsError(
      "internal",
      `Rentger API Error (${response.status}): ${errorBody}`
    );
  }

  // Si la respuesta no tiene cuerpo (ej. 204 No Content), devuelve un objeto de éxito
  if (response.status === 204) {
    return { success: true, status: 204 };
  }

  return response.json();
};


// --- CLOUD FUNCTIONS EXPUESTAS ---

/**
 * Verifica la conexión con la API de Rentger.
 */
export const rentger_ping = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!RENTGER_API_KEY) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "La API Key de Rentger no está configurada en el backend."
    );
  }
  try {
    // Usamos un endpoint simple que requiera autenticación para validar la clave
    await rentgerApiCall("/assets?limit=1", "GET");
    return { success: true, message: "Pong!" };
  } catch (error) {
    console.error("Rentger Ping failed:", error);
    throw error;
  }
});

/**
 * Sincroniza (crea o actualiza) un propietario en Rentger.
 */
export const rentger_syncOwner = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { name, email, phone, dni } = data;
  if (!name || !email) {
    throw new functions.https.HttpsError("invalid-argument", "Nombre y email son requeridos.");
  }

  try {
    const payload = {
      name,
      email,
      phone,
      id_number: dni,
      // Aquí podrías añadir más campos si el frontend los enviara
    };
    // El endpoint para buscar o crear es complejo, usaremos un POST simple asumiendo que crea
    // En un caso real, aquí habría una lógica para buscar por email primero (GET) y si no existe, crear (POST)
    const response = await rentgerApiCall("/people", "POST", payload);
    return { success: true, rentgerId: (response as any).id, data: response };
  } catch (error) {
    console.error("Sync Owner failed:", error);
    throw error;
  }
});


/**
 * Sincroniza (crea o actualiza) una propiedad en Rentger.
 */
export const rentger_syncAsset = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { property } = data;
  if (!property || !property.address) {
    throw new functions.https.HttpsError("invalid-argument", "Datos de la propiedad son requeridos.");
  }

  try {
    const payload = {
      "kind_id": 1, // 1 = Piso
      "address": property.address,
      "city": property.city,
      "province": "Murcia",
      "country_code": "ES",
      "postal_code": "30001", // Default, se podría mejorar
    };
    const response = await rentgerApiCall("/assets", "POST", payload);
    return { success: true, data: response };
  } catch (error) {
    console.error("Sync Asset failed:", error);
    throw error;
  }
});


/**
 * Sube una firma (imagen en base64) como un documento asociado a una persona.
 */
export const rentger_uploadSignature = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { imageBase64, personId, fileName } = data;
  if (!imageBase64 || !personId || !fileName) {
    throw new functions.https.HttpsError("invalid-argument", "Faltan datos para subir la firma.");
  }

  try {
    const payload = {
      "name": fileName,
      "file": imageBase64, // La API de Rentger espera el base64 raw
      "person_id": personId,
    };
    // Endpoint para subir documentos
    await rentgerApiCall("/documents", "POST", payload);
    return { success: true };
  } catch (error) {
    console.error("Upload Signature failed:", error);
    throw error;
  }
});

/**
 * Elimina un usuario por completo de Auth y Firestore.
 * Solo accesible por administradores (Admin, Staff, Agency).
 */
export const admin_deleteUser = functions.region('europe-west1').https.onCall(async (data, context) => {
  // 1. Verificación básica de autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado para realizar esta acción.");
  }

  // 2. Verificar que el que llama es Staff/Admin en Firestore
  const callerDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || (callerData.role !== 'staff' && callerData.role !== 'admin' && callerData.role !== 'agency')) {
    throw new functions.https.HttpsError("permission-denied", "No tienes permisos de administrador para borrar usuarios.");
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Se requiere el UID del usuario a eliminar.");
  }

  // Prevenir que alguien se borre a sí mismo por error
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError("failed-precondition", "No puedes eliminar tu propia cuenta desde este panel.");
  }

  try {
    // 3. Borrar de Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 4. Borrar de Firestore (colección users)
    await admin.firestore().collection("users").doc(uid).delete();

    console.log(`Usuario ${uid} eliminado del sistema por ${context.auth.uid}`);
    return { success: true, message: `Usuario eliminado correctamente.` };
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    throw new functions.https.HttpsError("internal", error.message || "Error al eliminar el usuario del sistema.");
  }
});
