"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentger_uploadSignature = exports.rentger_syncAsset = exports.rentger_syncOwner = exports.rentger_ping = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// Inicializa Firebase Admin para poder acceder a otros servicios si fuera necesario
admin.initializeApp();
// --- CONFIGURACIÓN DE SEGURIDAD ---
// Obtiene la API key de Rentger de las variables de entorno seguras de Firebase.
// ¡NUNCA escribas la clave directamente aquí!
const RENTGER_API_KEY = functions.config().rentger.apikey;
const RENTGER_API_BASE = "https://api.rentger.com/api/v1";
// --- HELPERS ---
/**
 * Función para estandarizar las llamadas a la API de Rentger.
 * Incluye automáticamente la autenticación.
 */
const rentgerApiCall = async (endpoint, method, body) => {
    const options = {
        method: method,
        headers: {
            "Authorization": `Bearer ${RENTGER_API_KEY}`,
            "Content-Type": "application/json",
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await (0, node_fetch_1.default)(`${RENTGER_API_BASE}${endpoint}`, options);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new functions.https.HttpsError("internal", `Rentger API Error (${response.status}): ${errorBody}`);
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
exports.rentger_ping = functions.https.onCall(async (data, context) => {
    if (!RENTGER_API_KEY) {
        throw new functions.https.HttpsError("failed-precondition", "La API Key de Rentger no está configurada en el backend.");
    }
    try {
        // Usamos un endpoint simple que requiera autenticación para validar la clave
        await rentgerApiCall("/assets?limit=1", "GET");
        return { success: true, message: "Pong!" };
    }
    catch (error) {
        console.error("Rentger Ping failed:", error);
        throw error;
    }
});
/**
 * Sincroniza (crea o actualiza) un propietario en Rentger.
 */
exports.rentger_syncOwner = functions.https.onCall(async (data, context) => {
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
        return { success: true, rentgerId: response.id, data: response };
    }
    catch (error) {
        console.error("Sync Owner failed:", error);
        throw error;
    }
});
/**
 * Sincroniza (crea o actualiza) una propiedad en Rentger.
 */
exports.rentger_syncAsset = functions.https.onCall(async (data, context) => {
    const { property } = data;
    if (!property || !property.address) {
        throw new functions.https.HttpsError("invalid-argument", "Datos de la propiedad son requeridos.");
    }
    try {
        const payload = {
            "kind_id": 1,
            "address": property.address,
            "city": property.city,
            "province": "Murcia",
            "country_code": "ES",
            "postal_code": "30001", // Default, se podría mejorar
        };
        const response = await rentgerApiCall("/assets", "POST", payload);
        return { success: true, data: response };
    }
    catch (error) {
        console.error("Sync Asset failed:", error);
        throw error;
    }
});
/**
 * Sube una firma (imagen en base64) como un documento asociado a una persona.
 */
exports.rentger_uploadSignature = functions.https.onCall(async (data, context) => {
    const { imageBase64, personId, fileName } = data;
    if (!imageBase64 || !personId || !fileName) {
        throw new functions.https.HttpsError("invalid-argument", "Faltan datos para subir la firma.");
    }
    try {
        const payload = {
            "name": fileName,
            "file": imageBase64,
            "person_id": personId,
        };
        // Endpoint para subir documentos
        await rentgerApiCall("/documents", "POST", payload);
        return { success: true };
    }
    catch (error) {
        console.error("Upload Signature failed:", error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map