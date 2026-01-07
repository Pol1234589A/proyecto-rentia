"use client";

import { InvestorDossier } from "@/components/InvestorDossier";
import { useOpportunities } from "@/hooks/useOpportunities";
import { Loader2 } from "lucide-react";

export default function DossierPage() {
    const { opportunities, loading } = useOpportunities();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-rentia-gold" />
            </div>
        );
    }

    return <InvestorDossier opportunities={opportunities} />;
}
