
import { NextResponse } from 'next/server';
import { RentgerBackendService } from '@/lib/rentger/service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, message, asset_id } = body;

        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Nombre y Email son obligatorios' },
                { status: 400 }
            );
        }

        const result = await RentgerBackendService.createLead({
            name,
            email,
            phone,
            message,
            asset_id,
            source: 'Web RentiARoom'
        });

        console.log(`Lead creado exitosamente: ${email}`);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Route Leads Error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
