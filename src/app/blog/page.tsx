import React, { Suspense } from 'react';
import { BlogView } from "@/components/BlogView";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog y Noticias | Alquiler de Habitaciones y Coliving | RentiaRoom',
    description: 'Noticias, consejos y guía sobre el mercado del coliving y alquiler por habitaciones en Murcia. Mantente informado con RentiaRoom.',
};

export default function BlogPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
            <BlogView />
        </Suspense>
    );
}
