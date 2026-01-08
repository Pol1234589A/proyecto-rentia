
import { NextResponse } from 'next/server';
import { RentgerBackendService } from '@/lib/rentger/service';
import { db } from '@/firebase';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

export async function POST() {
    try {
        console.log("Iniciando sincronización desde servidor...");
        const allRemoteContracts = await RentgerBackendService.getAllActiveContracts();

        let updated = 0;
        let created = 0;

        const snapshot = await getDocs(collection(db, "contracts"));
        const local = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

        for (const rc of allRemoteContracts) {
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
                // Impuesto por negocio: solo importar si terminan después de 2024 o no tienen fecha fin
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
                        notes: "Sincronizado vía Backend API"
                    });
                    created++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            updated,
            created,
            totalProcessed: allRemoteContracts.length
        });

    } catch (error: any) {
        console.error('API Sync Error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
