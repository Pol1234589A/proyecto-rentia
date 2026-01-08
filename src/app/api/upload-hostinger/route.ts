
import { NextResponse } from 'next/server';
import { HostingerService } from '@/lib/hostinger';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No se recibió ningún archivo" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Generar nombre único para evitar colisiones
        const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

        const publicUrl = await HostingerService.uploadFile(buffer, uniqueName);

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
