"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { HomePageContent } from '../types';

interface ContentContextType {
    home: HomePageContent;
    loading: boolean;
}

// Default Data (Fallback if DB is empty)
const defaultHomeContent: HomePageContent = {
    hero: {
        titlePrefix: 'Transforma tu propiedad en una inversión',
        titleHighlight: 'gestionada y rentable',
        subtitle: 'Gestionamos tus habitaciones o piso completo. Invertimos en publicidad para buscar a los mejores inquilinos y coordinamos el día a día para que tú no tengas que hacerlo.',
        backgroundImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
        ctaPrimary: 'Quiero saber más',
        ctaSecondary: 'Ver oportunidades',
        overlayOpacity: 0.6
    },
    solutions: {
        title: 'La solución profesional para propietarios',
        subtitle: 'En RentiaRoom nos adaptamos a tus necesidades, ya sea alquiler por habitaciones o tradicional.',
        card1Title: 'Gestión 360º',
        card1Desc: 'Nos ocupamos del ciclo de vida del alquiler. Desde la publicación y visitas hasta la salida del inquilino.',
        card2Title: 'Estrategia de Visibilidad',
        card2Desc: 'Invertimos nuestro propio capital en publicidad y redes sociales para dar la máxima visibilidad a tus habitaciones.'
    },
    cta: {
        title: '¿Necesitas ayuda con tu propiedad?',
        subtitle: 'RentiaRoom te ofrece una gestión profesional y cercana. Deja las preocupaciones en nuestras manos.',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
        buttonText: 'Contactar por WhatsApp'
    }
};

const ContentContext = createContext<ContentContextType>({
    home: defaultHomeContent,
    loading: true
});

export const useContent = () => useContext(ContentContext);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [homeContent, setHomeContent] = useState<HomePageContent>(defaultHomeContent);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "app_config", "content"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Deep merge to ensure structure
                setHomeContent({
                    hero: { ...defaultHomeContent.hero, ...(data.home?.hero || {}) },
                    solutions: { ...defaultHomeContent.solutions, ...(data.home?.solutions || {}) },
                    cta: { ...defaultHomeContent.cta, ...(data.home?.cta || {}) }
                });
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return (
        <ContentContext.Provider value={{ home: homeContent, loading }}>
            {children}
        </ContentContext.Provider>
    );
};
