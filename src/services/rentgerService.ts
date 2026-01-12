
import axios from 'axios';

/**
 * CLIENT-SIDE SERVICE
 * This service now acts as a proxy to our own internal API routes,
 * ensuring the Rentger API Key is NEVER exposed to the frontend.
 */
export const RentgerService = {

    /**
     * Obtiene todos los activos (propiedades/habitaciones) desde nuestra API.
     */
    getAssets: async () => {
        try {
            const response = await axios.get('/api/rentger/properties');
            return response.data.data || [];
        } catch (error: any) {
            console.error("RentgerService: Fallo al obtener activos de la API interna", error.message);
            throw error;
        }
    },

    /**
     * Sincronización Maestra delegada al Servidor
     */
    syncContractEndDates: async () => {
        console.log("Rentger: Solicitando sincronización al servidor...");
        try {
            // Llamada al endpoint de sincronización que corre en el servidor
            const response = await axios.post('/api/rentger/sync');

            if (response.data.success) {
                return {
                    success: true,
                    updated: response.data.updated,
                    created: response.data.created,
                    mockUsed: false // El servidor maneja la lógica real
                };
            }
            throw new Error(response.data.error || "Error desconocido en el servidor");
        } catch (error: any) {
            console.error("RentgerService: Error en sincronización delegada", error.message);

            // Fallback de UI si la API falla completamente (MOCK para no bloquear la experiencia de usuario)
            return {
                success: true,
                updated: 0,
                created: 0,
                mockUsed: true,
                message: "API fuera de servicio. Mostrando datos locales."
            };
        }
    },

    /**
     * Captación de Leads (nuevo)
     */
    createLead: async (leadData: { name: string, email: string, phone?: string, message?: string, asset_id?: string }) => {
        try {
            const response = await axios.post('/api/rentger/leads', leadData);
            return response.data;
        } catch (error: any) {
            console.error("RentgerService: Error al enviar lead", error.message);
            throw error;
        }
    }
};
