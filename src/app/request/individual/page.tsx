"use client";

import { PublishRequestView } from "@/components/PublishRequestView";
import { useRouter } from "next/navigation";

export default function RequestIndividualPage() {
    const router = useRouter();

    const handleNavigate = (path: string) => { // PublishRequestView prop compatible?
        // Check props of PublishRequestView. LegacyApp passed handleNavigate.
        // If PublishRequestView uses onNavigate, we handle it.
        // Usually it navigates back or home.
        if (path === 'home') router.push('/');
        else if (path === 'brokers') router.push('/colaboradores');
        else router.push(path.startsWith('/') ? path : `/${path}`);
    };

    return <PublishRequestView type="individual" onNavigate={handleNavigate} />;
}
