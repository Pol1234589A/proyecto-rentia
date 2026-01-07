import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { opportunities as staticOpportunities } from '../data';
import { Opportunity } from '../types';

export function useOpportunities() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(staticOpportunities);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "opportunities"), (snapshot) => {
            const firestoreOpps: Opportunity[] = [];
            const allDbIds = new Set<string>();

            snapshot.forEach((doc) => {
                const data = doc.data();
                allDbIds.add(doc.id);

                // Filter out soft-deleted items AND invalid items (Safety Check)
                if ((data as any).deleted) return;
                if (!data.financials || !data.title) return; // Prevent crash if data is corrupt

                firestoreOpps.push({ ...data, id: doc.id } as Opportunity);
            });

            // Fusión: Datos Firestore (activos) + Datos Estáticos que no están en Firestore
            const missingStatics = staticOpportunities.filter(o => !allDbIds.has(o.id));
            const combinedOpps = [...firestoreOpps, ...missingStatics];

            setOpportunities(combinedOpps);
            setLoading(false);

        }, (error) => {
            console.warn("Firestore access denied or error. Using static data.", error);
            setOpportunities(staticOpportunities);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { opportunities, loading };
}
