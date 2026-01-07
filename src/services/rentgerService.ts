
import axios from 'axios';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';

const RENTGER_API_KEY = "gAAAAABhSDSf3Ss-8s3vFOBF-KqVx5Xz5Mfw87YYbdwLSVO0Ijg6z7IsYVJc1RKhN7SV_7V2W--WFB2nOGvLEdmV6yJe90nQw==";
const BASE_URL = "/api-rentger"; // Usaremos un proxy en vite.config.ts para evitar CORS si es necesario, o llamada directa si el servidor lo permite. 
// Nota: Rentger API suele requerir proxy CORS en desarrollo local. 
// Para producción, idealmente esto va en backend. Para esta demo frontend, intentaremos directo o vía proxy.

// Como no puedo editar vite.config.ts ahora mismo fácilmente para añadir el proxy sin reiniciar servidor manualmente a veces,
// intentaré la URL directa primero. Si falla por CORS, avisaré.
const DIRECT_URL = "/api-rentger"; // IMPORTANTE: Usar el proxy configurado en next.config.ts

let authToken: string | null = null;
let tokenExpiration: number = 0;

export const RentgerService = {

    /**
     * Obtiene el token de autenticación.
     */
    authenticate: async (): Promise<string | null> => {
        if (authToken && Date.now() < tokenExpiration) return authToken;

        try {
            console.log("Rentger: Autenticando...");
            const response = await axios.get(`${DIRECT_URL}/token/${RENTGER_API_KEY}`);

            if (response.data) {
                // Rentger a veces devuelve el token directamente o en objeto. Ajustar según respuesta real.
                // Asumiendo respuesta directa con token string o { token: "..." }
                const token = typeof response.data === 'string' ? response.data : response.data.token || response.data.access_token;

                if (token) {
                    authToken = token;
                    tokenExpiration = Date.now() + (55 * 60 * 1000);
                    console.log("Rentger: Autenticado correctamente.");
                    return authToken;
                }
            }
            console.warn("Rentger: Respuesta de auth irreconocible", response.data);
            return null;
        } catch (error) {
            console.error("Rentger: Error de autenticación", error);
            return null;
        }
    },

    /**
     * Obtiene el listado de contratos desde Rentger.
     */
    getContracts: async () => {
        const token = await RentgerService.authenticate();
        if (!token) throw new Error("No se pudo obtener token de Rentger");

        try {
            // Ajuste header Auth según documentación estándar
            const response = await axios.get(`${DIRECT_URL}/contracts`, {
                headers: { 'X-Auth-Token': token }
            });
            // Asumiendo que response.data es un array de contratos o { data: [...] }
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        } catch (error) {
            console.error("Rentger: Error obteniendo contratos", error);
            throw error;
        }
    },

    /**
     * Sincroniza (Actualiza e IMPORTA) contratos desde Rentger a Firestore.
     */
    syncContractEndDates: async () => {
        console.log("Rentger: Iniciando sincronización masiva...");
        let rentgerContracts: any[] = [];

        try {
            rentgerContracts = await RentgerService.getContracts();
            console.log(`Rentger: Recuperados ${rentgerContracts.length} contratos.`);
        } catch (e) {
            console.error("Rentger: Fallo al obtener contratos reales.", e);
            // Fallback development only IF real API fails completely to avoid UI block, but trying real first.
            rentgerContracts = [];
        }

        if (rentgerContracts.length === 0) {
            return { success: false, updated: 0, message: "No se encontraron contratos en Rentger o error de conexión." };
        }

        let updatedCount = 0;
        let createdCount = 0;

        // Recuperar contratos locales
        const snapshot = await getDocs(collection(db, "contracts"));
        const localContracts = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

        // Procesar contratos de Rentger
        for (const rc of rentgerContracts) {
            // Intentar match por ID de rentger (si ya lo teníamos) o por nombre inquilino + propiedad
            // Simplificación: Nombre Inquilino.
            // Nota: La API Rentger devuelve campos específicos. Mapear:
            // rc.tenant (objeto o string), rc.propertyMs (propiedad), rc.rooms (habitación), rc.dateEnd (fin), rc.price (precio)
            // IMPORTANTE: Inspeccionar estructura real en cuanto funcione, por ahora mapeo defensivo.

            const tenantName = rc.tenant?.name || rc.tenantName || "Inquilino Rentger";
            const endDate = rc.dateEnd || rc.endDate || null;
            const rentAmount = rc.price || rc.rent || 0;
            const propertyName = rc.property?.name || rc.propertyName || "Propiedad Externa";

            const existingLocal = localContracts.find(lc =>
                (lc.rentgerId && lc.rentgerId == rc.id) ||
                (lc.tenantName?.toLowerCase() === tenantName.toLowerCase())
            );

            if (existingLocal) {
                // ACTUALIZAR EXISTENTE
                if (endDate && existingLocal.endDate !== endDate) {
                    await updateDoc(doc(db, "contracts", existingLocal.id), {
                        endDate: endDate,
                        rentgerId: rc.id,
                        lastRentgerSync: new Date()
                    });
                    updatedCount++;
                }
                // IMPORTAR NUEVO (CREAR)
                // Solo si está activo o recientemente finalizado > 2024
                const isRelevant = !endDate || new Date(endDate).getFullYear() >= 2024;

                if (isRelevant) {
                    await addDoc(collection(db, "contracts"), {
                        tenantName: tenantName,
                        propertyName: propertyName,
                        roomName: rc.room?.name || 'Habitación s/d',
                        rentAmount: Number(rentAmount),
                        depositAmount: 0, // Desconocido en lista simple
                        startDate: rc.dateStart || rc.startDate || new Date().toISOString().split('T')[0],
                        endDate: endDate || '',
                        status: endDate && new Date(endDate) < new Date() ? 'finished' : 'active',
                        rentgerId: rc.id,
                        rentgerSynced: true,
                        createdAt: new Date(),
                        notes: "Importado automáticamente de Rentger"
                    });
                    createdCount++;
                }
            }
        }

        return { success: true, updated: updatedCount, created: createdCount, totalRemote: rentgerContracts.length };
    }
};
