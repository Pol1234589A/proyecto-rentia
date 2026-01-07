
import { Property } from '../data/rooms';
import { UserProfile } from '../types';

// Servicio "Dummy" para mantener la estructura sin llamar a backend real
class RentgerService {
    
    /**
     * Simula conexión
     */
    public async ping(): Promise<boolean> {
        console.log("Rentger Service: Modo desconectado (Client-side only)");
        return true;
    }

    /**
     * Simula sincronización
     */
    public async syncAsset(property: Property): Promise<any> {
        console.log("Rentger Service: Sincronización de activo simulada", property.address);
        return { success: true, simulated: true };
    }

    /**
     * Simula creación de propietario
     */
    public async syncOwner(user: UserProfile): Promise<string | null> {
        console.log("Rentger Service: Sincronización de owner simulada", user.name);
        return "local_owner_id";
    }

    /**
     * Simula subida de firma
     */
    public async uploadGdprSignature(blob: Blob, rentgerPersonId: string): Promise<boolean> {
        console.log("Rentger Service: Firma procesada localmente (Firebase Storage)", rentgerPersonId);
        return true;
    }
}

export const rentgerService = new RentgerService();
