
import React, { ReactNode } from 'react';
import { Hammer } from 'lucide-react';

interface MaintenanceOverlayProps {
  isActive: boolean;
  children: ReactNode;
  title?: string;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ isActive, children, title = "Módulo en Mantenimiento" }) => {
  if (!isActive) return <>{children}</>;

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {/* Blurred Content */}
      <div className="filter blur-md opacity-40 pointer-events-none select-none h-full w-full">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl border border-white/50 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full animate-in zoom-in-95 duration-500 sticky top-1/2 -translate-y-1/2">
          <div className="w-20 h-20 bg-rentia-black text-rentia-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Hammer className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-rentia-black font-display mb-3">{title}</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Estamos realizando mejoras en esta sección para ofrecerte una mejor experiencia. Volverá a estar disponible muy pronto.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
            Trabajando en ello
          </div>
        </div>
      </div>
    </div>
  );
};
