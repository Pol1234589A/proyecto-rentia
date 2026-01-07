"use client";

import { LandingView } from "@/components/LandingView";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
    const { opportunities, loading } = useOpportunities();
    const router = useRouter();

    const handleCardClick = (id: string) => {
        router.push(`/oportunidades/${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-rentia-blue" />
            </div>
        );
    }

    return <LandingView opportunities={opportunities} onClick={handleCardClick} />;
}
