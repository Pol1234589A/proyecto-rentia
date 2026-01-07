"use client";
import React, { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ConfigProvider } from '../contexts/ConfigContext';
import { ContentProvider } from '../contexts/ContentContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <AuthProvider>
            <ConfigProvider>
                <ContentProvider>
                    <LanguageProvider>
                        {children}
                    </LanguageProvider>
                </ContentProvider>
            </ConfigProvider>
        </AuthProvider>
    );
};
