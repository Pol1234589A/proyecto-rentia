
import { NextResponse } from 'next/server';
import { RentgerBackendService } from '@/lib/rentger/service';

export async function GET() {
    try {
        const properties = await RentgerBackendService.getAssets();
        return NextResponse.json({ success: true, data: properties });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
