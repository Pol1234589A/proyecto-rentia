
import React, { useState, useEffect } from 'react';
import { FileText, Wifi, AlertTriangle, MessageCircle, Calendar, Sparkles, Clock, CheckCircle, Home, LogOut, ChevronRight, Download, CreditCard, Euro } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Contract } from '../../types';
import { Property, CleaningConfig } from '../../data/rooms';

export const TenantDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'cleaning'>('home');

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Buscar contrato activo del usuario
            const q = query(collection(db, "contracts"), where("tenantId", "==", currentUser.uid), where("status", "==", "active"));
            const contractSnap = await getDocs(q);
            
            if (!contractSnap.empty) {
                const contractData = { ...contractSnap.docs[0].data(), id: contractSnap.docs[0].id } as Contract;
                setActiveContract(contractData);

                // 2. Buscar datos de la propiedad asociada
                if (contractData.propertyId) {
                    const propRef = doc(db, "properties", contractData.propertyId);
                    const propSnap = await getDoc(propRef);
                    if (propSnap.exists()) {
                        setProperty({ ...propSnap.data(), id: propSnap.id } as Property);
                    }
                }
            }
        } catch (error) {
            console.error("Error cargando datos del inquilino:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [currentUser]);

  // Lógica para calcular la PRÓXIMA LIMPIEZA
  const getNextCleaningDate = (config?: CleaningConfig) => {
      if (!config || !config.enabled || !config.days || config.days.length === 0) return null;
      
      const dayMap: Record<string, number> = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
      const today = new Date();
      const currentDayIdx = today.getDay();
      
      // Convertir nombres de días a índices y ordenar
      const cleaningDays = config.days.map(d => dayMap[d]).sort((a,b) => a - b);
      
      // Buscar el próximo día en la misma semana
      let nextDayIdx = cleaningDays.find(d => d >= currentDayIdx); // Incluye hoy si aún no ha pasado la hora (simplificado: asume que hoy cuenta)
      
      // Si no hay más días esta semana, coger el primero de la siguiente
      if (nextDayIdx === undefined) {
          nextDayIdx = cleaningDays[0];
      }

      const daysUntil = (nextDayIdx + 7 - currentDayIdx) % 7;
      // Si es hoy (0 días), asumimos que es la próxima visita
      
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + daysUntil);
      
      return nextDate; // Objeto Date
  };

  const nextCleaning = getNextCleaningDate(property?.cleaningConfig);
  const nextCleaningStr = nextCleaning ? nextCleaning.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No programada';

  if (loading) {
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rentia-blue"></div></div>;
  }

  // --- VISTAS INTERNAS ---

  const HomeView = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-rentia-blue to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h2 className="text-xl font-bold mb-1 relative z-10">Hola, {currentUser?.displayName?.split(' ')[0] || 'Inquilino'} 👋</h2>
              <p className="text-blue-100 text-sm relative z-10 flex items-center gap-1 opacity-90">
                  <Home className="w-3 h-3" /> {property?.address || 'Tu hogar'}
              </p>
              
              <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-white/20">
                      <MessageCircle className="w-5 h-5 text-rentia-gold" />
                      Grupo WhatsApp
                  </button>
                  <button className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-white/20">
                      <AlertTriangle className="w-5 h-5 text-red-300" />
                      Incidencia
                  </button>
              </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-3">
                      <Wifi className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Red WiFi</h3>
                  <p className="font-bold text-gray-800 text-sm truncate">Rentia_Casa</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">Murcia2025!</p>
              </div>
              
              <div 
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
                onClick={() => setActiveTab('cleaning')}
              >
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                      <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Limpieza</h3>
                  <p className="font-bold text-gray-800 text-sm truncate">{property?.cleaningConfig?.enabled ? nextCleaning?.toLocaleDateString('es-ES', {weekday: 'short', day: 'numeric'}) : 'No activo'}</p>
                  <p className="text-xs text-indigo-600 mt-1 font-bold">Ver detalles →</p>
              </div>
          </div>

          {/* Payments Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm">Estado Pagos</h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Al día
                  </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Próximo Recibo</p>
                      <p className="text-lg font-bold text-gray-900">{activeContract?.rentAmount}€</p>
                      <p className="text-[10px] text-gray-400">Vence el 05 del próximo mes</p>
                  </div>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-full transition-colors">
                      <CreditCard className="w-5 h-5" />
                  </button>
              </div>
          </div>
      </div>
  );

  const CleaningView = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <button onClick={() => setActiveTab('home')} className="text-gray-500 hover:text-rentia-black flex items-center gap-1 text-sm font-bold mb-2">
              <ChevronRight className="w-4 h-4 rotate-180" /> Volver
          </button>

          <h2 className="text-2xl font-bold text-rentia-black font-display">Servicio de Limpieza</h2>
          
          {!property?.cleaningConfig?.enabled ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Esta propiedad no tiene servicio de limpieza contratado actualmente.</p>
              </div>
          ) : (
              <>
                  {/* NEXT CLEANING CARD */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Próxima Visita</p>
                      <h3 className="text-3xl font-bold font-display mb-1 capitalize">{nextCleaningStr}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-90 mt-2 bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                          <Clock className="w-4 h-4" />
                          {property.cleaningConfig.hours}
                      </div>
                  </div>

                  {/* DETAILS CARD */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">Detalles del Servicio</h3>
                      
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar className="w-5 h-5" /></div>
                              <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Frecuencia</p>
                                  <p className="text-sm font-medium text-gray-800">{property.cleaningConfig.days.join(', ')}</p>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-lg text-green-600"><Euro className="w-5 h-5" /></div>
                              <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Coste Servicio</p>
                                  <p className="text-sm font-medium text-gray-800">{property.cleaningConfig.costPerHour}€ / hora</p>
                              </div>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 mt-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          Recuerda dejar las zonas comunes (pasillos, cocina y baños) despejadas para facilitar el trabajo.
                      </div>
                  </div>
              </>
          )}
      </div>
  );

  const DocsView = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-2xl font-bold text-rentia-black font-display mb-4">Documentos</h2>
          
          {[1,2,3].map(i => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                      <div>
                          <p className="font-bold text-sm text-gray-800">Recibo Alquiler - Octubre</p>
                          <p className="text-xs text-gray-400">05 Oct 2025</p>
                      </div>
                  </div>
                  <button className="text-gray-400 hover:text-rentia-blue p-2"><Download className="w-5 h-5"/></button>
              </div>
          ))}
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-rentia-blue rounded-lg"><FileText className="w-5 h-5"/></div>
                  <div>
                      <p className="font-bold text-sm text-gray-800">Contrato Arrendamiento</p>
                      <p className="text-xs text-gray-400">Vigente hasta Jun 2026</p>
                  </div>
              </div>
              <button className="text-gray-400 hover:text-rentia-blue p-2"><Download className="w-5 h-5"/></button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans max-w-md mx-auto shadow-2xl relative">
      {/* Mobile Top Bar */}
      <div className="bg-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
          <h1 className="font-display font-bold text-lg text-rentia-black">Mi Espacio Rentia</h1>
          <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
          </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'cleaning' && <CleaningView />}
          {activeTab === 'docs' && <DocsView />}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-40 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold">Inicio</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('cleaning')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'cleaning' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <Sparkles className={`w-6 h-6 ${activeTab === 'cleaning' ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold">Limpieza</span>
          </button>

          <button 
            onClick={() => setActiveTab('docs')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'docs' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <FileText className={`w-6 h-6 ${activeTab === 'docs' ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold">Docs</span>
          </button>
      </div>
    </div>
  );
};
