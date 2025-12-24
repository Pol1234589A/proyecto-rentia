
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface TeamMemberConfig {
    id: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    image: string;
    startHour: number;
    endHour: number;
    whatsappMessage: string;
}

export interface SiteConfig {
    adminContact: TeamMemberConfig;
    directorContact: TeamMemberConfig;
    general: {
        email: string;
        address: string;
        instagram: string;
        facebook: string;
        linkedin: string;
        tiktok: string;
    };
}

const defaultConfig: SiteConfig = {
    adminContact: {
        id: 'admin',
        name: 'Sandra',
        role: 'Secretaría y Administración',
        phone: '34611948589',
        email: 'info@rentiaroom.com',
        image: '',
        startHour: 9,
        endHour: 14,
        whatsappMessage: 'Hola Sandra, tengo una consulta administrativa...'
    },
    directorContact: {
        id: 'director',
        name: 'Pol',
        role: 'Dirección y Estrategia',
        phone: '34672886369',
        email: 'info@rentiaroom.com',
        image: '',
        startHour: 9,
        endHour: 20,
        whatsappMessage: 'Hola Pol, estoy interesado en oportunidades de inversión...'
    },
    general: {
        email: 'info@rentiaroom.com',
        address: 'Murcia (España)',
        instagram: 'https://www.instagram.com/rentiaroom_/',
        facebook: 'https://www.facebook.com/share/1Cpvx6fmh2/',
        linkedin: 'https://www.linkedin.com/company/rentia-room/',
        tiktok: 'https://www.tiktok.com/@rentiaroom'
    }
};

const ConfigContext = createContext<SiteConfig>(defaultConfig);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "app_config", "general"), (docSnap) => {
            if (docSnap.exists()) {
                // Merge con default para asegurar que no falten campos si se añaden nuevos en el futuro
                setConfig({ ...defaultConfig, ...docSnap.data() as SiteConfig });
            }
        });
        return () => unsub();
    }, []);

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};
