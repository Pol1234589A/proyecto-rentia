
import { Property } from '../data/rooms';
import { UserProfile } from '../types';

/**
 * Servicio para comunicarse con la API de Rentger a través del backend seguro (Vercel Serverless Functions).
 * La API key NUNCA se expone en el frontend.
 */
class RentgerService {
    
    private readonly API_BASE = '/api/rentger';

    /**
     * Convierte un Blob a Base64 para enviarlo por la red
     */
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Eliminar la cabecera "data:image/png;base64," si existe, para enviar solo el raw
                const base64 = result.split(',')[1] || result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Helper para hacer llamadas a las API routes de Vercel
     */
    private async apiCall<T>(endpoint: string, body?: object): Promise<T> {
        try {
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            return data as T;
        } catch (error: any) {
            console.error(`Rentger API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Verifica conexión con el Backend (Ping)
     */
    public async ping(): Promise<boolean> {
        try {
            const result = await this.apiCall<{ success: boolean; message: string }>('/ping');
            return result.success === true;
        } catch (error) {
            console.error("Rentger Ping Error:", error);
            return false;
        }
    }

    /**
     * Sincronizar un Activo (Propiedad)
     */
    public async syncAsset(property: Property): Promise<{ success: boolean; rentgerId?: string; action?: string; data?: any }> {
        try {
            const result = await this.apiCall<{ success: boolean; rentgerId: string; action: string; data: any }>('/sync-asset', { property });
            return result;
        } catch (error) {
            console.error("Error syncing asset:", error);
            throw error;
        }
    }

    /**
     * Crea o actualiza una persona (Propietario)
     */
    public async syncOwner(user: UserProfile): Promise<string | null> {
        try {
            const result = await this.apiCall<{ success: boolean; rentgerId: string; action: string }>('/sync-owner', { 
                name: user.name,
                email: user.email,
                phone: user.phone,
                dni: user.dni
            });
            return result.rentgerId || null;
        } catch (error) {
            console.error("Error syncing owner:", error);
            return null;
        }
    }

    /**
     * Sube el documento de firma RGPD
     */
    public async uploadGdprSignature(blob: Blob, rentgerPersonId: string): Promise<boolean> {
        try {
            const base64Image = await this.blobToBase64(blob);
            
            const result = await this.apiCall<{ success: boolean; documentId?: string }>('/upload-signature', { 
                imageBase64: base64Image,
                personId: rentgerPersonId,
                fileName: 'Firma_RGPD_RentiaRoom.png'
            });

            return result.success === true;
        } catch (error) {
            console.error("Error uploading signature:", error);
            return false;
        }
    }

    /**
     * Obtiene lista de propiedades desde Rentger (para sincronización)
     */
    public async getAssets(): Promise<any[]> {
        try {
            const result = await this.apiCall<{ success: boolean; data: any[] }>('/get-assets');
            return result.data || [];
        } catch (error) {
            console.error("Error getting assets:", error);
            return [];
        }
    }

    /**
     * Obtiene lista de personas desde Rentger
     */
    public async getPeople(): Promise<any[]> {
        try {
            const result = await this.apiCall<{ success: boolean; data: any[] }>('/get-people');
            return result.data || [];
        } catch (error) {
            console.error("Error getting people:", error);
            return [];
        }
    }
}

export const rentgerService = new RentgerService();
