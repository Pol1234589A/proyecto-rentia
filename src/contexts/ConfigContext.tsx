"use client";

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

export interface SeasonalEvent {
    id: string;
    name: string; // Internal name (e.g., "Navidad 2025")
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    overlayColor: string; // Hex or rgba
    overlayOpacity: number; // 0 to 1
    isActive: boolean;
}

export interface RoomsAlertConfig {
    isActive: boolean;
    title: string;
    message: string;
    variant: 'info' | 'warning' | 'error' | 'success';
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
    seo: {
        siteTitle: string;
        metaDescription: string;
    };
    modules: {
        showBlog: boolean;
        maintenanceBlog: boolean; // NEW
        showDiscounts: boolean;
        maintenanceDiscounts: boolean; // NEW
        maintenanceMode: boolean; // Global site maintenance
    };
    billing: {
        companyIban: string;
        companyName: string;
    };
    holidays: string[]; // Array of YYYY-MM-DD
    seasonalEvents: SeasonalEvent[];
    roomsAlert: RoomsAlertConfig;
}

const defaultConfig: SiteConfig = {
    adminContact: {
        id: 'admin',
        name: 'Administración',
        role: 'Gestión Operativa',
        phone: '34611948589',
        email: 'info@rentiaroom.com',
        image: '',
        startHour: 9,
        endHour: 14,
        whatsappMessage: 'Hola, tengo una consulta administrativa...'
    },
    directorContact: {
        id: 'director',
        name: 'Dirección General',
        role: 'Director General',
        phone: '34672886369',
        email: 'info@rentiaroom.com',
        image: '',
        startHour: 9,
        endHour: 20,
        whatsappMessage: 'Hola, estoy interesado en oportunidades de inversión...'
    },
    general: {
        email: 'info@rentiaroom.com',
        address: 'Murcia (España)',
        instagram: 'https://www.instagram.com/rentiaroom_/',
        facebook: 'https://www.facebook.com/share/1Cpvx6fmh2/',
        linkedin: 'https://www.linkedin.com/company/rentia-room/',
        tiktok: 'https://www.tiktok.com/@rentiaroom'
    },
    seo: {
        siteTitle: 'RentiaRoom | Gestión de Inversiones',
        metaDescription: 'Líderes en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia.'
    },
    modules: {
        showBlog: true,
        maintenanceBlog: false,
        showDiscounts: true,
        maintenanceDiscounts: false,
        maintenanceMode: false
    },
    billing: {
        companyIban: '',
        companyName: 'Rentia Investments S.L.'
    },
    holidays: [],
    seasonalEvents: [],
    roomsAlert: {
        isActive: false,
        title: 'Aviso Importante',
        message: 'Estamos actualizando nuestro catálogo.',
        variant: 'info'
    }
};

const ConfigContext = createContext<SiteConfig>(defaultConfig);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "app_config", "general"), (docSnap) => {
            if (docSnap.exists()) {
                // ... logic ...
                const data = docSnap.data();
                setConfig({
                    ...defaultConfig,
                    ...data,
                    general: { ...defaultConfig.general, ...(data.general || {}) },
                    seo: { ...defaultConfig.seo, ...(data.seo || {}) },
                    modules: { ...defaultConfig.modules, ...(data.modules || {}) },
                    billing: { ...defaultConfig.billing, ...(data.billing || {}) },
                    holidays: data.holidays || [],
                    seasonalEvents: data.seasonalEvents || [],
                    roomsAlert: { ...defaultConfig.roomsAlert, ...(data.roomsAlert || {}) }
                });
            }
        }, (error) => {
            console.error("Error cargando ConfigContext:", error);
        });
        return () => unsub();
    }, []);

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};
