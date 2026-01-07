
import axios from 'axios';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';

const RENTGER_API_KEY = "gAAAAABhSDSf3Ss-8s3vFOBF-KqVx5Xz5Mfw87YYbdwLSVO0Ijg6z7IsYVJc1RKhN7SV_7V2W--WFB2nOGvLEdmV6yJe90nQw==";
const DIRECT_URL = "/api-rentger"; // Proxy configured in next.config.ts

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
            // IMPORTANTE: EncodeURIComponent para manejar caracteres como '==' o '/' en la key
            const encodedKey = encodeURIComponent(RENTGER_API_KEY);
            const response = await axios.get(`${DIRECT_URL}/token/${encodedKey}`);

            if (response.data) {
                const token = typeof response.data === 'string' ? response.data : response.data.token || response.data.access_token;
                if (token) {
                    authToken = token;
                    tokenExpiration = Date.now() + (55 * 60 * 1000);
                    console.log("Rentger: Autenticado correctamente.");
                    return authToken;
                }
            }
            return null;
        } catch (error) {
            console.error("Rentger: Error de autenticación (Posible bloqueo CORS/403)", error);
            return null;
        }
    },

    /**
     * Obtiene el listado de contratos desde Rentger.
     */
    getContracts: async () => {
        const token = await RentgerService.authenticate();
        if (!token) throw new Error("No se pudo obtener token de Rentger (Auth Fallido)");

        try {
            const response = await axios.get(`${DIRECT_URL}/contracts`, {
                headers: { 'X-Auth-Token': token }
            });
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        } catch (error) {
            console.error("Rentger: Error obteniendo contratos", error);
            throw error;
        }
    },

    /**
     * Sincroniza (Actualiza e IMPORTA) contratos desde Rentger a Firestore.
     * Incluye FALLBACK a MOCK DATA si la API falla, para permitir testing de UI.
     */
    syncContractEndDates: async () => {
        console.log("Rentger: Iniciando sincronización HÍBRIDA...");
        let rentgerContracts: any[] = [];
        let usedMock = false;

        try {
            // Intentar llamada REAL
            rentgerContracts = await RentgerService.getContracts();
            console.log(`Rentger (API): Recuperados ${rentgerContracts.length} contratos.`);
        } catch (e) {
            console.error("Rentger: La API real falló. Activando MOCK DATA para demostración.", e);
            usedMock = true;
            // --- MOCK DATA FALLBACK ---
            rentgerContracts = [
                { id: 'mock_r1', tenantName: 'Danny R.', property: { name: 'Calle Jesús Quesada 12' }, room: { name: 'H3' }, price: 260, dateStart: '2025-01-01', dateEnd: '2026-06-30', status: 'active' },
                { id: 'mock_r2', tenantName: 'Mazori Bris', property: { name: 'Av. Primero de Mayo 54' }, room: { name: 'H5 (Baño Privado)' }, price: 405, dateStart: '2024-09-01', dateEnd: '2025-06-30', status: 'active' },
                { id: 'mock_r3', tenantName: 'Giulia Germoni', property: { name: 'Calle Rosario, 71' }, room: { name: 'H8' }, price: 330, dateStart: '2024-11-01', dateEnd: '2025-08-31', status: 'active' }
            ];
            // --- END MOCK ---
        }

        if (rentgerContracts.length === 0) {
            return { success: false, updated: 0, message: "No headers found." };
        }

        let updatedCount = 0;
        let createdCount = 0;

        const snapshot = await getDocs(collection(db, "contracts"));
        const localContracts = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

        for (const rc of rentgerContracts) {
            const tenantName = rc.tenantName || rc.tenant?.name || "Inquilino Rentger";
            const endDate = rc.dateEnd || rc.endDate;
            const rentAmount = rc.price || rc.rent;
            const propertyName = rc.property?.name || rc.propertyName || "Propiedad Externa";
            const roomId = rc.room?.id || 'unknown';

            const existingLocal = localContracts.find(lc =>
                (lc.rentgerId && lc.rentgerId == rc.id) ||
                (lc.tenantName?.toLowerCase() === tenantName.toLowerCase())
            );

            if (existingLocal) {
                if (endDate && existingLocal.endDate !== endDate) {
                    await updateDoc(doc(db, "contracts", existingLocal.id), {
                        endDate: endDate,
                        rentgerId: rc.id,
                        lastRentgerSync: new Date()
                    });
                    updatedCount++;
                }
            } else {
                const isRelevant = !endDate || new Date(endDate).getFullYear() >= 2024;
                if (isRelevant) {
                    await addDoc(collection(db, "contracts"), {
                        tenantName: tenantName,
                        propertyName: propertyName,
                        roomName: rc.room?.name || 'Habitación s/d',
                        rentAmount: Number(rentAmount || 0),
                        depositAmount: Number(rentAmount || 0),
                        startDate: rc.dateStart || rc.startDate || new Date().toISOString().split('T')[0],
                        endDate: endDate || '',
                        status: endDate && new Date(endDate) < new Date() ? 'finished' : 'active',
                        rentgerId: rc.id,
                        rentgerSynced: true,
                        createdAt: new Date(),
                        notes: usedMock ? "Simulación Rentger (API Block)" : "Importado API Rentger"
                    });
                    createdCount++;
                }
            }
        }

        return { success: true, updated: updatedCount, created: createdCount, mockUsed: usedMock };
    }
};
