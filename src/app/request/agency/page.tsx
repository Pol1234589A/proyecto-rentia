"use client";

import { PublishRequestView } from "@/components/PublishRequestView";
import { useRouter } from "next/navigation";

export default function RequestAgencyPage() {
    const router = useRouter();

    const handleNavigate = (path: string) => {
        if (path === 'home') router.push('/');
        else if (path === 'brokers') router.push('/colaboradores');
        else router.push(path.startsWith('/') ? path : `/${path}`);
    };

    return <PublishRequestView type="agency" onNavigate={handleNavigate} />;
}
