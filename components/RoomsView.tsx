
import React, { useState, useMemo } from 'react';
import { Home, MapPin, CheckCircle, Clock, User, MessageCircle, Filter, AlertCircle, Receipt, Sparkles, Hammer, ChevronDown, ChevronUp, HelpCircle, Building, Gift, Users, Wallet } from 'lucide-react';
import { properties, Property, Room } from '../data/rooms';

export const RoomsView: React.FC = () => {
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});

  const toggleProperty = (id: string) => {
    setExpandedProperties(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate total rooms under management
  const totalRoomsManaged = useMemo(() => {
    return properties.reduce((acc, property) => acc + property.rooms.length, 0);
  }, []);

  // Filtrado de propiedades: Mostrar solo si tienen habitaciones libres si el filtro está activo
  const filteredProperties = useMemo(() => {
    if (!showOnlyAvailable) return properties;
    return properties.filter(p => p.rooms.some(r => r.status === 'available'));
  }, [showOnlyAvailable]);

  // Función para determinar el color/estado inteligente del CONTENEDOR
  const getRoomStatusContainerStyle = (room: Room) => {
    // Special Status: Renovation
    if (room.specialStatus === 'renovation') {
        return 'bg-yellow-50 border-yellow-200 border-dashed';
    }

    if (room.status === 'available') return 'bg-white border-green-200 shadow-sm';
    
    // Lógica para "Próximamente" (Naranja)
    if (room.availableFrom && room.availableFrom !== 'Consultar' && room.availableFrom !== 'Inmediata') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays < 45) {
            return 'bg-orange-50 border-orange-200';
        }
    }
    
    // Por defecto Azul (Alquilada)
    return 'bg-gray-50 border-gray-100 opacity-80';
  };

  const getStatusLabel = (room: Room) => {
    // Special Status overrides
    if (room.specialStatus === 'renovation') {
        return { icon: <Hammer className="w-3.5 h-3.5"/>, text: 'En Reformas', color: 'text-yellow-700' };
    }

    if (room.status === 'available') return { icon: <CheckCircle className="w-3.5 h-3.5"/>, text: 'Libre', color: 'text-green-700' };
    
    if (room.availableFrom && room.availableFrom !== 'Consultar') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays < 45) {
             return { icon: <HelpCircle className="w-3.5 h-3.5"/>, text: 'Consultar disponibilidad', color: 'text-orange-700' };
        }
    }
    
    return { icon: <User className="w-3.5 h-3.5"/>, text: 'Alquilada', color: 'text-gray-500' };
  };

  return (
    <div className="font-sans bg-gray-50 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-rentia-black text-white overflow-hidden">
        <div className="absolute inset-0">
           <img
             src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
             alt="Habitaciones Disponibles"
             className="w-full h-full object-cover opacity-40"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-xs md:text-sm shadow-lg uppercase tracking-wider">
                <Home className="w-4 h-4" />
                Catálogo en tiempo real
            </div>
          <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 tracking-tight drop-shadow-lg text-white">
            Habitaciones Disponibles
          </h1>
          <p className="text-lg text-gray-200 font-light max-w-2xl mx-auto mb-6">
            Consulta el estado de todas nuestras viviendas gestionadas.
          </p>
          
          {/* Total Rooms Counter */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl">
              <Building className="w-6 h-6 text-rentia-blue" />
              <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold leading-none">{totalRoomsManaged}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80">Habitaciones en gestión</span>
              </div>
          </div>
        </div>
      </section>

      {/* PLAN AMIGO BANNER */}
      <section className="container mx-auto px-4 -mt-6 relative z-30 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-rentia-blue rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border-2 border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rentia-gold/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-shrink-0 relative mx-auto md:mx-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <Gift className="w-8 h-8 md:w-10 md:h-10 text-rentia-blue" />
              </div>
              <div className="absolute -top-2 -right-2 bg-rentia-gold text-rentia-black text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
                  NUEVO
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mb-2">
                Plan Amigo: <span className="text-rentia-gold">Descuento en Suministros</span>
              </h3>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-3 md:mb-1">
                ¿Ya eres inquilino? Si nos traes a un amigo que pase el filtro y alquile con nosotros, te descontamos <span className="font-bold text-white bg-white/20 px-1 rounded">30€</span> en tu próxima factura de suministros.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-green-500/20 text-green-100 border border-green-500/30 px-2 py-1 rounded flex items-center gap-1">
                    <Users className="w-3 h-3" /> Acumulable
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500/20 text-blue-100 border border-blue-500/30 px-2 py-1 rounded flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> 2 amigos = 60€ dto
                  </span>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <a
                href="https://api.whatsapp.com/send?phone=34611948589&text=Hola%20Sandra,%20soy%20inquilino%20y%20quiero%20recomendar%20a%20un%20amigo%20para%20el%20Plan%20Amigo."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-rentia-gold hover:bg-yellow-400 text-rentia-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg transform hover:-translate-y-1 w-full md:w-auto min-h-[44px]"
              >
                  <MessageCircle className="w-5 h-5" />
                  Recomendar Amigo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-12 relative z-20">
         
         {/* Filters */}
         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2 text-rentia-black font-bold">
                 <Filter className="w-5 h-5 text-rentia-blue" />
                 <span>Filtrar Viviendas</span>
             </div>
             
             <label className="flex items-center cursor-pointer relative select-none p-2 w-full sm:w-auto">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={showOnlyAvailable}
                    onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[10px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rentia-blue"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Ver solo con habitaciones libres</span>
             </label>
         </div>

         {/* Property Grid (Compact Mode) */}
         <div className="flex flex-col gap-4 max-w-4xl mx-auto">
             {filteredProperties.map(property => {
                 const availableCount = property.rooms.filter(r => r.status === 'available').length;
                 const totalRooms = property.rooms.length;
                 const isExpanded = expandedProperties[property.id] || false;
                 const hasNew = property.rooms.some(r => r.specialStatus === 'new');
                 
                 return (
                     <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 transition-all duration-300">
                         {/* Header Compacto - Sin Fotos */}
                         <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            onClick={() => toggleProperty(property.id)}
                         >
                             <div className="flex items-start gap-4">
                                 {/* Icono Casa / Edificio */}
                                 <div className={`p-3 rounded-lg flex-shrink-0 ${availableCount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                     <Home className="w-6 h-6" />
                                 </div>

                                 <div>
                                     <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-lg text-rentia-black leading-tight">{property.address}</h3>
                                        {hasNew && (
                                            <span className="inline-flex text-[9px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide items-center gap-0.5">
                                                <Sparkles className="w-2 h-2" /> Nuevo
                                            </span>
                                        )}
                                     </div>
                                     <p className="text-sm text-gray-500">{property.city}</p>
                                     <div className="mt-1 flex items-center gap-3 text-xs font-medium flex-wrap">
                                         <span className="text-gray-400">{totalRooms} Habitaciones</span>
                                         {availableCount > 0 ? (
                                             <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                 <CheckCircle className="w-3 h-3" /> {availableCount} Disponible{availableCount > 1 ? 's' : ''}
                                             </span>
                                         ) : (
                                             <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Completo</span>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                                <a 
                                    href={property.googleMapsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-white border border-gray-200 hover:border-rentia-blue text-gray-600 hover:text-rentia-blue px-4 py-3 rounded-lg transition-all text-xs font-bold uppercase tracking-wide shadow-sm hover:shadow-md min-h-[44px] flex-1 sm:flex-initial justify-center"
                                    title="Ver ubicación en Google Maps"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MapPin className="w-4 h-4" />
                                    Ver en Mapa
                                </a>
                                <button 
                                    className={`text-gray-400 hover:text-rentia-black transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} p-2 ml-2`}
                                    aria-label="Expandir detalles"
                                >
                                    <ChevronDown className="w-6 h-6" />
                                </button>
                             </div>
                         </div>

                         {/* Room List (Accordion) */}
                         <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50/50 ${isExpanded ? 'max-h-[1000px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                             <div className="p-4 space-y-3">
                                 {property.rooms.map(room => {
                                     const containerStyle = getRoomStatusContainerStyle(room);
                                     const statusInfo = getStatusLabel(room);
                                     const isConsult = statusInfo.text === 'Consultar disponibilidad';
                                     const isRenovation = room.specialStatus === 'renovation';
                                     
                                     return (
                                         <div key={room.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors relative overflow-hidden gap-3 ${containerStyle}`}>
                                             
                                             {/* "NEW" Badge Effect */}
                                             {room.specialStatus === 'new' && (
                                                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rentia-gold to-yellow-300"></div>
                                             )}

                                             {/* Room Info */}
                                             <div className="flex flex-col pl-2">
                                                 <div className="flex items-center gap-2">
                                                     <span className="font-bold text-base text-gray-800">{room.name}</span>
                                                     {room.specialStatus === 'new' && (
                                                         <span className="text-[9px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                                                             <Sparkles className="w-2 h-2" /> Nuevo
                                                         </span>
                                                     )}
                                                 </div>
                                                 <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-sm font-semibold text-rentia-blue">
                                                        {room.price > 0 ? `${room.price}€` : 'Consultar'}
                                                    </span>
                                                 </div>
                                                 {/* Expenses Info */}
                                                 <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-medium">
                                                     <Receipt className="w-3 h-3 text-gray-400" />
                                                     <span>{room.expenses}</span>
                                                 </div>
                                             </div>

                                             {/* Status & Date & Action */}
                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                                 <div className="flex flex-col items-start sm:items-end">
                                                     <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${statusInfo.color}`}>
                                                         {statusInfo.icon}
                                                         {statusInfo.text}
                                                     </div>
                                                     
                                                     {room.status !== 'available' && !isConsult && !isRenovation && (
                                                         <span className="text-[10px] font-medium text-gray-400 mt-1">
                                                             Hasta: {room.availableFrom}
                                                         </span>
                                                     )}
                                                     {isRenovation && (
                                                         <span className="text-[10px] font-medium text-yellow-600 mt-1">
                                                             Previsión: {room.availableFrom}
                                                         </span>
                                                     )}
                                                 </div>

                                                 {/* Action Button */}
                                                 {(room.status === 'available' || isConsult) && !isRenovation && (
                                                     <a 
                                                        href={isConsult 
                                                            ? `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20quería%20saber%20si%20la%20habitaci%C3%B3n%20${room.name}%20en%20${property.address}%20se%20va%20a%20quedar%20libre%20pronto.`
                                                            : `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20habitaci%C3%B3n%20${room.name}%20en%20${property.address}`
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] ${
                                                            room.status === 'available' 
                                                            ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white' 
                                                            : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                                                        }`}
                                                     >
                                                         <MessageCircle className="w-4 h-4" />
                                                         {room.status === 'available' ? 'Contactar' : 'Consultar'}
                                                     </a>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     </div>
                 );
             })}
         </div>
      </section>

      {/* Footer Info */}
      <section className="pb-16 container mx-auto px-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 max-w-2xl mx-auto text-center shadow-sm">
             <h4 className="font-bold text-rentia-black mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                 <AlertCircle className="w-4 h-4 text-rentia-blue" />
                 Guía de estados
             </h4>
             <div className="flex justify-center gap-4 text-xs text-gray-600 flex-wrap">
                 <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span> 
                     <span className="font-medium text-green-700">Libre</span>
                 </div>
                 <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1 rounded-full border border-blue-100">
                     <Sparkles className="w-3 h-3 text-purple-600" />
                     <span className="font-medium text-purple-700">Nuevo</span>
                 </div>
                 <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                     <HelpCircle className="w-3 h-3 text-orange-600" /> 
                     <span className="font-medium text-orange-700">Consultar</span>
                 </div>
                 <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                     <Hammer className="w-3 h-3 text-yellow-600" /> 
                     <span className="font-medium text-yellow-700">Reformas</span>
                 </div>
             </div>
        </div>
      </section>

    </div>
  );
};