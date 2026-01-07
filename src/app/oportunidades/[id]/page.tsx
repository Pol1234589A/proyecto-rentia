"use client";

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOpportunities } from '@/hooks/useOpportunities';
import { DetailView } from '@/components/DetailView';
import { Loader2 } from 'lucide-react';

export default function OpportunityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { opportunities, loading } = useOpportunities();

    // params.id can be string or string[]
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const opportunity = useMemo(() => {
        return opportunities.find(o => o.id === id);
    }, [opportunities, id]);

    // Find Prev/Next
    const { hasNext, hasPrev, nextId, prevId } = useMemo(() => {
        const index = opportunities.findIndex(o => o.id === id);
        return {
            hasNext: index !== -1 && index < opportunities.length - 1,
            hasPrev: index > 0,
            nextId: index !== -1 && index < opportunities.length - 1 ? opportunities[index + 1].id : null,
            prevId: index > 0 ? opportunities[index - 1].id : null
        };
    }, [opportunities, id]);

    const handleBack = () => {
        router.push('/oportunidades');
    };

    const handleNext = () => {
        if (nextId) router.push(`/oportunidades/${nextId}`);
    };

    const handlePrev = () => {
        if (prevId) router.push(`/oportunidades/${prevId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-rentia-blue" />
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-gray-700">Oportunidad no encontrada</h2>
                <button onClick={handleBack} className="text-rentia-blue hover:underline">Volver al listado</button>
            </div>
        );
    }

    return (
        <div className="bg-[#f9f9f9] min-h-screen">
            <DetailView
                opportunity={opportunity}
                onBack={handleBack}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={hasNext}
                hasPrev={hasPrev}
            />
        </div>
    );
}
