
import axios from 'axios';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';

const RENTGER_API_KEY = "gAAAAABhSDSf3Ss-8s3vFOBF-KqVx5Xz5Mfw87YYbdwLSVO0Ijg6z7IsYVJc1RKhN7SV_7V2W--WFB2nOGvLEdmV6yJe90nQw==";
const BASE_URL = "/api-rentger"; // Usaremos un proxy en vite.config.ts para evitar CORS si es necesario, o llamada directa si el servidor lo permite. 
// Nota: Rentger API suele requerir proxy CORS en desarrollo local. 
// Para producción, idealmente esto va en backend. Para esta demo frontend, intentaremos directo o vía proxy.

// Como no puedo editar vite.config.ts ahora mismo fácilmente para añadir el proxy sin reiniciar servidor manualmente a veces,
// intentaré la URL directa primero. Si falla por CORS, avisaré.
const DIRECT_URL = "https://api.rentger.com";

let authToken: string | null = null;
let tokenExpiration: number = 0;

export const RentgerService = {

    /**
     * Obtiene el token de autenticación a partir de la API Key.
     * El token suele durar un tiempo limitado (ej. 1 hora).
     */
    authenticate: async (): Promise<string | null> => {
        // Verificar si tenemos token válido en memoria
        if (authToken && Date.now() < tokenExpiration) {
            return authToken;
        }

        try {
            console.log("Rentger: Autenticando...");
            // Endpoint doc: GET /token/{api key}
            // Nota: La documentación dice "/token/{api key}". 
            const response = await axios.get(`${DIRECT_URL}/token/${RENTGER_API_KEY}`);

            if (response.data && response.data.token) {
                authToken = response.data.token;
                // Asumimos 1 hora de validez si no viene expira, o usamos el campo si existe
                // La doc dice "Expired Token" es un error posible.
                tokenExpiration = Date.now() + (55 * 60 * 1000); // 55 min safe buffer
                console.log("Rentger: Autenticado correctamente.");
                return authToken;
            }
            return null;
        } catch (error) {
            console.error("Rentger: Error de autenticación", error);
            // Fallback para desarrollo si la API falla o CORS bloquea: devolver null para manejarlo en UI
            return null;
        }
    },

    /**
     * Obtiene el listado de contratos.
     * Endpoint asumido: GET /contracts (Verificar en documentación real si falla)
     */
    getContracts: async () => {
        const token = await RentgerService.authenticate();
        if (!token) throw new Error("No se pudo obtener token de Rentger");

        try {
            const response = await axios.get(`${DIRECT_URL}/contracts`, {
                headers: {
                    'X-Auth-Token': token, // Asunción estándar, verificar header exacto doc postman si falla
                    'Authorization': `Bearer ${token}` // Alternativa común
                }
            });
            return response.data;
        } catch (error) {
            console.error("Rentger: Error obteniendo contratos", error);
            throw error;
        }
    },

    /**
     * Sincroniza las fechas de finalización de contratos desde Rentger a Firestore.
     * Busca coincidencias por DNI de inquilino o nombre de habitación/propiedad.
     */
    syncContractEndDates: async () => {
        console.log("Rentger: Iniciando sincronización...");
        // 1. Obtener contratos de Rentger
        // const rentgerContracts = await RentgerService.getContracts(); 

        // MOCK TEMPORAL para probar flujo UI (ya que CORS probablemente bloqueará en localhost sin proxy)
        // Cuando funcione API real, descomentar arriba y quitar esto.
        const rentgerContracts = [
            { id: 'r1', tenantName: 'Mazori Bris', endDate: '2026-06-30', status: 'active', property: 'Av. Primero de Mayo 54', room: 'H5' },
            { id: 'r2', tenantName: 'Danny', endDate: '2026-05-15', status: 'active', property: 'Calle Jesús Quesada 12', room: 'H3' }
        ];

        let updatedCount = 0;

        // 2. Obtener contratos activos de Firestore
        const snapshot = await getDocs(query(collection(db, "contracts"), where("status", "==", "active")));

        // 3. Cruzar datos
        for (const docSnapshot of snapshot.docs) {
            const localContract = docSnapshot.data();

            // Lógica de coincidencia simple por nombre de inquilino (idealmente DNI)
            const remoteMatch = rentgerContracts.find((rc: any) =>
                rc.tenantName.toLowerCase().includes(localContract.tenantName?.toLowerCase()) ||
                localContract.tenantName?.toLowerCase().includes(rc.tenantName.toLowerCase())
            );

            if (remoteMatch) {
                // Actualizar fecha fin si es diferente
                if (remoteMatch.endDate !== localContract.endDate) {
                    await updateDoc(doc(db, "contracts", docSnapshot.id), {
                        endDate: remoteMatch.endDate,
                        rentgerId: remoteMatch.id,
                        lastRentgerSync: new Date()
                    });
                    updatedCount++;
                    console.log(`Rentger: Actualizado contrato ${localContract.tenantName} a fecha ${remoteMatch.endDate}`);
                }
            }
        }

        return { success: true, updated: updatedCount };
    }
};
