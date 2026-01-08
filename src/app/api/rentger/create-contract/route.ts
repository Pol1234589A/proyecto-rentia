import { NextResponse } from 'next/server';
import { RentgerBackendService } from '@/lib/rentger/service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            candidateName,
            candidateEmail,
            candidatePhone,
            propertyAddress,
            roomName,
            price,
            deposit,
            startDate,
            endDate
        } = body;

        if (!candidateName || !candidateEmail || !propertyAddress) {
            return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
        }

        // 1. Encontrar el Asset ID en Rentger
        const assets = await RentgerBackendService.getAssets();

        // Búsqueda "Smart" del activo
        // Intentamos coincidir la dirección del inmueble
        // Rentger tiene 'address' y 'alias'.
        // Si es una habitación, a veces Rentger las tiene como sub-unidades o propiedades separadas.
        // Asumiremos que buscamos la PROPIEDAD PRINCIPAL y asignamos el inquilino a ella (o habitación si existe como activo)
        // TODO: Refinar lógica si Rentger tiene habitaciones como activos independientes. 
        // Por ahora, buscamos similitud en alias o dirección.

        const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
        const target = normalize(propertyAddress);

        let matchedAsset = assets.find(a => normalize(a.address || "").includes(target) || normalize(a.alias || "").includes(target));

        if (!matchedAsset) {
            console.warn(`Rentger: No se encontró activo para ${propertyAddress}. Se intentará con el nombre de la habitación si aplica.`);
            // Fallback: search by room name in alias?
        }

        if (!matchedAsset) {
            return NextResponse.json({ success: false, error: `No se encontró la propiedad "${propertyAddress}" en Rentger. Verifica que esté creada y los nombres coincidan.` }, { status: 404 });
        }

        console.log(`Rentger: Asset encontrado: ${matchedAsset.id} (${matchedAsset.alias})`);

        // 2. Crear Inquilino
        const tenantRes = await RentgerBackendService.createTenant({
            name: candidateName,
            email: candidateEmail,
            phone: candidatePhone
        });

        const tenantId = tenantRes.data.id || tenantRes.data.user_id; // Ajustar según respuesta real
        if (!tenantId) {
            throw new Error("No se pudo obtener el ID del inquilino creado en Rentger.");
        }

        // 3. Crear Contrato Borrador
        const contractRes = await RentgerBackendService.createContract({
            asset_id: matchedAsset.id,
            tenant_id: tenantId,
            date_start: startDate || new Date().toISOString().split('T')[0],
            date_end: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default 1 year
            price: Number(price) || 0,
            deposit: Number(deposit) || 0
        });

        return NextResponse.json({
            success: true,
            contractId: contractRes.data.id,
            message: "Contrato creado y enviado a firmar en Rentger."
        });

    } catch (error: any) {
        console.error("API Rentger Error:", error.message);
        return NextResponse.json(
            { success: false, error: error.message || "Error al procesar con Rentger" },
            { status: 500 }
        );
    }
}
