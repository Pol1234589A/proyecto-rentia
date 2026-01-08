import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

export class HostingerService {
    private static config = {
        host: "145.14.156.68",
        user: "u281225306.ftpalmadespierta",
        password: process.env.FTP_PASSWORD || "100610lop333A!", // Fallback explicito por si env falla en dev
        secure: false
    };

    /**
     * Sube un archivo al FTP de Hostinger
     * @param fileBuffer Buffer del archivo
     * @param fileName Nombre del archivo (ej: 'imagen.jpg')
     * @returns URL pública del archivo
     */
    static async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
        const client = new ftp.Client();
        // client.ftp.verbose = true; // Descomentar para debug

        try {
            if (!this.config.password) {
                throw new Error("Falta la contraseña FTP en las variables de entorno (FTP_PASSWORD).");
            }

            await client.access({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                secure: false
            });

            // La raíz del FTP parece ser la carpeta de la aplicación (contiene .next, public, etc.)
            // En Next.js, los archivos estáticos van en 'public'. 
            // Si subimos a 'public/uploads', serán accesibles en rentiaroom.com/uploads/archivo.jpg
            await client.ensureDir("public/uploads");

            const source = Readable.from(fileBuffer);
            await client.uploadFrom(source, fileName);

            // URL pública
            return `https://www.rentiaroom.com/uploads/${fileName}`;

        } catch (error: any) {
            console.error("Hostinger FTP Error:", error);
            throw new Error(`Error subiendo a Hostinger: ${error.message}`);
        } finally {
            client.close();
        }
    }
}
