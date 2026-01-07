"use client";

import { OpportunityPresentation } from "@/components/OpportunityPresentation";
import { useOpportunities } from "@/hooks/useOpportunities";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function PresentationPage() {
    const { opportunities, loading } = useOpportunities();
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const opportunity = useMemo(() => {
        return opportunities.find(o => o.id === id);
    }, [opportunities, id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <h2 className="text-2xl font-bold text-gray-700">Oportunidad no encontrada</h2>
                <button
                    onClick={() => router.push('/')}
                    className="text-rentia-blue hover:underline"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return <OpportunityPresentation opportunity={opportunity} onClose={() => router.push('/')} />;
}
