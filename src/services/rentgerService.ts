
import axios from 'axios';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';

const RENTGER_API_KEY = process.env.NEXT_PUBLIC_RENTGER_API_KEY || "gAAAAABhSDSf3Ss-8s3vFOBF-KqVx5Xz5Mfw87YYbdwLSVO0Ijg6z7IsYVJc1RKhN7SV_7V2W--WFB2nOGvLEdmV6yJe90nQw==";
const DIRECT_URL = "/api-rentger";

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
            const encodedKey = encodeURIComponent(RENTGER_API_KEY);
            const response = await axios.get(`${DIRECT_URL}/token/${encodedKey}`);

            if (response.data) {
                const token = typeof response.data === 'string' ? response.data : response.data.token || response.data.access_token;
                if (token) {
                    authToken = token;
                    tokenExpiration = Date.now() + (55 * 60 * 1000);
                    return authToken;
                }
            }
            return null;
        } catch (error) {
            console.error("Rentger: Auth Fallido", error);
            return null;
        }
    },

    /**
     * Obtiene todos los activos (propiedades/habitaciones).
     */
    getAssets: async () => {
        const token = await RentgerService.authenticate();
        if (!token) throw new Error("Auth required");

        const response = await axios.get(`${DIRECT_URL}/v1/assets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.data || response.data || [];
    },

    /**
     * Obtiene los contratos de un activo específico.
     */
    getContractsByAsset: async (assetId: string | number) => {
        const token = await RentgerService.authenticate();
        if (!token) throw new Error("Auth required");

        const response = await axios.get(`${DIRECT_URL}/v1/contracts/asset/${assetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.data || response.data || [];
    },

    /**
     * Sincronización Maestra (Híbrida)
     */
    syncContractEndDates: async () => {
        console.log("Rentger: Sincronización iniciada...");
        let allRemoteContracts: any[] = [];
        let usedMock = false;

        try {
            const assets = await RentgerService.getAssets();
            console.log(`Rentger: Procesando ${assets.length} activos...`);

            for (const asset of assets) {
                const contracts = await RentgerService.getContractsByAsset(asset.id);
                // Inyectar nombre del activo en los contratos para mapeo posterior
                const mapped = contracts.map((c: any) => ({
                    ...c,
                    propertyName: asset.alias || asset.name,
                    assetId: asset.id
                }));
                allRemoteContracts = [...allRemoteContracts, ...mapped];
            }
        } catch (e) {
            console.error("Rentger: API real bloqueada o fallida. Usando Mock de investigación.");
            usedMock = true;
            // Estructura MOCK basada en la investigación de Postman (v1/assets + v1/contracts)
            allRemoteContracts = [
                { id: 101, propertyName: 'Av. Primero de Mayo 54', roomName: 'H5', users: [{ name: 'Mazori Bris', type: 2 }], date_start: '2024-09-01', date_end: '2025-06-30', price: 405 },
                { id: 102, propertyName: 'Calle Jesús Quesada 12', roomName: 'H3', users: [{ name: 'Danny R.', type: 2 }], date_start: '2025-01-01', date_end: '2026-06-30', price: 260 },
                { id: 103, propertyName: 'Calle Rosario, 71', roomName: 'H8', users: [{ name: 'Giulia Germoni', type: 2 }], date_start: '2024-11-01', date_end: '2025-08-31', price: 330 }
            ];
        }

        let updated = 0;
        let created = 0;

        const snapshot = await getDocs(collection(db, "contracts"));
        const local = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

        for (const rc of allRemoteContracts) {
            // Extraer inquilino (type: 2 en users) o usar fallback
            const tenant = rc.users?.find((u: any) => u.type === 2) || { name: rc.tenantName || 'Inquilino Rentger' };
            const tenantName = tenant.name;
            const endDate = rc.date_end || rc.endDate;
            const startDate = rc.date_start || rc.startDate;

            const existing = local.find(lc =>
                (lc.rentgerId && lc.rentgerId == rc.id) ||
                (lc.tenantName?.toLowerCase() === tenantName.toLowerCase())
            );

            if (existing) {
                if (endDate && existing.endDate !== endDate) {
                    await updateDoc(doc(db, "contracts", existing.id), {
                        endDate: endDate,
                        rentgerId: rc.id,
                        lastRentgerSync: new Date()
                    });
                    updated++;
                }
            } else {
                if (!endDate || new Date(endDate).getFullYear() >= 2024) {
                    await addDoc(collection(db, "contracts"), {
                        tenantName: tenantName,
                        propertyName: rc.propertyName || "Propiedad Rentger",
                        roomName: rc.roomName || "S/N",
                        rentAmount: Number(rc.price || 0),
                        depositAmount: Number(rc.price || 0),
                        startDate: startDate || new Date().toISOString().split('T')[0],
                        endDate: endDate || '',
                        status: endDate && new Date(endDate) < new Date() ? 'finished' : 'active',
                        rentgerId: rc.id,
                        rentgerSynced: true,
                        createdAt: new Date(),
                        notes: usedMock ? "Simulación (Activo -> Contrato)" : "Sincronizado vía API v1"
                    });
                    created++;
                }
            }
        }

        return { success: true, updated, created, mockUsed: usedMock };
    }
};
