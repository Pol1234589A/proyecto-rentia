
import React, { useState } from 'react';
import { Check, UserPlus, FileText, Clock, AlertTriangle, ShieldCheck, Hammer, Search, MessageCircle, X, ArrowRight } from 'lucide-react';

interface PainPoint {
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  longDesc: string;
}

export const ServicesView: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<PainPoint | null>(null);
  
  const services = [
    {
      id: 1,
      title: "Gestión Integral de Alquileres",
      description: "Nos encargamos de gestionar tus propiedades de principio a fin, facilitando cada etapa del proceso.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80", // Imagen profesional inmobiliaria
      points: [
        "Captación de inquilinos: Filtrado de perfiles.",
        "Contratos personalizados y legales.",
        "Coordinación de entradas y salidas.",
        "Gestión de incidencias.",
        "Supervisión del estado de la propiedad."
      ]
    },
    {
      id: 2,
      title: "Rent to Rent",
      description: "Ofrecemos un esquema en el que acordamos un ingreso fijo mensual mientras subarrendamos y gestionamos tus propiedades.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80", // Imagen de acuerdo/contrato
      points: [
        "Ingresos estables acordados.",
        "Gestión operativa delegada.",
        "Optimización del espacio.",
        "Estrategia de ocupación activa.",
        "Incremento de ingresos vs modelo tradicional."
      ]
    },
    {
      id: 3,
      title: "Optimización de Ingresos",
      description: "Buscamos mejorar la rentabilidad de tus propiedades mediante análisis de mercado y estrategias de precios.",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80", // Imagen financiera/crecimiento
      points: [
        "Análisis de mercado.",
        "Asesoría en precios competitivos.",
        "Estrategias personalizadas por propiedad.",
        "Enfoque en mejora del flujo de caja."
      ]
    },
    {
      id: 4,
      title: "Mantenimiento y Reparaciones",
      description: "Nos encargamos de la recepción de incidencias y la coordinación con seguros o técnicos especializados.",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
      points: [
        "Gestión de trámites con el seguro del hogar.",
        "Coordinación de técnicos (coste a cargo del propietario).",
        "Supervisión de los trabajos realizados.",
        "Atención a incidencias cotidianas."
      ]
    },
    {
      id: 5,
      title: "Seguro de Impagos (Opcional)",
      description: "No cubrimos impagos directamente, pero te ponemos en contacto con colaboradores de confianza que pueden gestionar este servicio para tu tranquilidad.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
      points: [
        "Acceso a colaboradores especializados.",
        "Gestión externa del seguro.",
        "Asesoramiento en la contratación.",
        "Protección opcional a través de terceros."
      ]
    },
    {
      id: 6,
      title: "Supervisión de Reformas",
      badge: "Nuevo Servicio",
      description: "Servicio a nuestros clientes para supervisar la reforma con colaboradores externos. Hemos creado un grupo de trabajo donde adaptamos las viviendas para ser alquiladas.",
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
      points: [
        "Adaptación especializada para alquiler por habitaciones.",
        "Grupo de trabajo con colaboradores externos verificados.",
        "Supervisión técnica de la reforma.",
        "Optimización de costes y espacios."
      ]
    }
  ];

  const painPoints: PainPoint[] = [
    {
      icon: <UserPlus className="w-8 h-8" />,
      title: "Selección de inquilinos",
      shortDesc: "Aplicamos filtros para minimizar riesgos, aunque el riesgo cero no existe.",
      longDesc: "Realizamos un proceso de filtrado solicitando documentación económica y referencias cuando es posible. Nuestro objetivo es encontrar el perfil que mejor se adapte a la vivienda para minimizar riesgos, aunque no podemos garantizar el comportamiento futuro de las personas."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Contratos personalizados",
      shortDesc: "Redactamos contratos adaptados a la normativa vigente y al tipo de alquiler.",
      longDesc: "Elaboramos contratos de arrendamiento específicos para cada habitación, asegurando que se cumpla la Ley de Arrendamientos Urbanos (LAU) o el Código Civil según corresponda, protegiendo los intereses de ambas partes dentro del marco legal."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Gestión de tiempo",
      shortDesc: "Nos ocupamos de coordinar visitas, entradas y salidas para ahorrarte tiempo.",
      longDesc: "Actuamos como tu representante para las gestiones operativas diarias. Coordinamos las visitas comerciales, la entrega de llaves y la revisión de inventario a la salida, liberándote de la carga presencial que conlleva el alquiler."
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Gestión de incidencias",
      shortDesc: "Atendemos los avisos de los inquilinos y coordinamos su solución.",
      longDesc: "Somos el primer punto de contacto para los inquilinos. Cuando surge un problema, evaluamos la situación y coordinamos con tu seguro o con técnicos profesionales. Los tiempos de resolución dependen de la disponibilidad de los terceros y la naturaleza de la avería."
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Control de cobros",
      shortDesc: "Realizamos seguimiento de los pagos para actuar ante retrasos.",
      longDesc: "Llevamos un control mensual de los ingresos. Si bien no podemos garantizar la ausencia de impagos, nuestro sistema de gestión nos permite detectar retrasos tempranamente y activar los protocolos de reclamación amistosa de inmediato."
    },
    {
      icon: <Hammer className="w-8 h-8" />,
      title: "Mantenimiento del inmueble",
      shortDesc: "Supervisamos el estado general para intentar prevenir deterioros mayores.",
      longDesc: "Realizamos visitas periódicas a las zonas comunes y mantenemos comunicación con los inquilinos para detectar necesidades de reparación. Nuestro objetivo es mantener el inmueble en condiciones habitables y atractivas para el mercado."
    },
  ];

  return (
    <div className="font-sans bg-white">
      
      {/* Header Section */}
      <section className="relative py-24 bg-rentia-black overflow-hidden">
        {/* Background Image with Brand Styling */}
        <div className="absolute inset-0 w-full h-full z-0">
            <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop" 
                alt="Servicios RentiaRoom" 
                className="w-full h-full object-cover grayscale"
            />
            {/* Blue tint overlay for brand consistency */}
            <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
            {/* Dark overlay + blur for text readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">Nuestros Servicios</h1>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm">
                Descubre cómo RentiaRoom gestiona tus activos inmobiliarios de forma profesional.
            </p>
        </div>
      </section>

      {/* --- BÚSQUEDA DE OPORTUNIDADES (Rediseñado para armonía visual) --- */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative flex flex-col md:flex-row items-center max-w-6xl mx-auto">
                
                {/* Elegant Gold Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-rentia-gold md:w-2 md:h-full"></div>

                <div className="p-8 md:p-12 flex-1">
                    <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 text-rentia-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Search className="w-4 h-4" />
                        Servicio Exclusivo
                    </div>
                    <h2 className="text-3xl font-bold text-rentia-black mb-4 font-display">
                        Canal de Oportunidades
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        ¿Buscas rentabilidad? Ofrecemos un servicio de búsqueda de inversiones inmobiliarias <span className="font-bold text-rentia-blue">totalmente gratuito</span> a través de nuestro canal privado.
                    </p>
                </div>

                <div className="p-8 md:p-12 bg-gray-50 w-full md:w-auto flex flex-col justify-center items-center md:border-l border-gray-100">
                     <a 
                        href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-rentia-blue hover:bg-blue-700 text-white transition-all px-8 py-4 rounded-lg shadow-lg hover:shadow-blue-200/50 font-bold text-lg group transform hover:-translate-y-1"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                        Unirme al Canal
                    </a>
                    <p className="text-xs text-gray-400 mt-3 font-medium">Acceso directo vía WhatsApp</p>
                </div>
            </div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-rentia-black mb-4 font-display">¡Nosotros gestionamos por ti!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
                Desde la gestión integral hasta la supervisión técnica de reformas, ofrecemos soluciones completas para propietarios e inversores.
            </p>
        </div>
      </section>

      {/* Services List (Zig Zag) */}
      <section className="py-10 bg-gray-50/50">
        <div className="container mx-auto px-4 max-w-6xl">
            {services.map((service, index) => (
                <div key={service.id} className={`flex flex-col md:flex-row gap-8 md:gap-16 items-center mb-20 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Image Side */}
                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-xl overflow-hidden shadow-xl aspect-[4/3] group bg-white">
                            <img 
                                src={service.image} 
                                alt={service.title} 
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                            />
                            {/* Brand Tint Overlay on Hover (fades out as image goes color, or stays subtle) */}
                            <div className="absolute inset-0 bg-rentia-blue/20 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-rentia-black/60 to-transparent opacity-60"></div>
                            
                            {service.badge && (
                                <div className="absolute top-4 left-4 bg-rentia-gold text-rentia-black text-xs font-bold px-3 py-1 rounded shadow z-20">
                                    {service.badge}
                                </div>
                            )}
                            
                            <div className="absolute bottom-4 left-4 text-white text-6xl font-bold opacity-20 font-display z-10">0{index + 1}</div>
                        </div>
                    </div>
                    
                    {/* Content Side */}
                    <div className="w-full md:w-1/2">
                        <h3 className="text-2xl md:text-3xl font-bold text-rentia-black mb-4 font-display">{service.title}</h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                            {service.description}
                        </p>
                        <ul className="space-y-3">
                            {service.points.map((point, i) => (
                                <li key={i} className="flex items-start text-gray-700">
                                    <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-rentia-gold/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-rentia-black" />
                                    </div>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Pain Points Grid ("¿Qué resolvemos?") - REDESIGNED FOR PROFESSIONALISM */}
      <section className="py-24 bg-white relative overflow-hidden">
          {/* Subtle background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-rentia-blue/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-64 h-64 bg-rentia-gold/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-rentia-black">
                      Soluciones Profesionales
                  </h2>
                  <p className="text-gray-500 text-lg">
                    En RentiaRoom aplicamos protocolos de gestión para minimizar los problemas habituales del alquiler.
                    <span className="block mt-1 font-medium text-rentia-blue text-sm uppercase tracking-wide mt-3">Haz clic en cada servicio para saber más</span>
                  </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {painPoints.map((item, index) => (
                      <div 
                        key={index} 
                        onClick={() => setSelectedFeature(item)}
                        className="bg-white p-8 rounded-xl shadow-idealista hover:shadow-idealista-hover border border-gray-100 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden cursor-pointer h-full flex flex-col"
                      >
                          {/* Hover Accent Line */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-rentia-gold transition-colors duration-300"></div>
                          
                          <div className="mb-6 flex justify-between items-start">
                             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors duration-300">
                                {item.icon}
                             </div>
                             <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-rentia-gold group-hover:text-rentia-black transition-all">
                                <ArrowRight className="w-4 h-4" />
                             </div>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{item.title}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                              {item.shortDesc}
                          </p>
                          <p className="text-rentia-blue text-xs font-bold mt-4 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                              Leer explicación detallada &rarr;
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* MODAL FOR DETAILS */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedFeature(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="bg-rentia-blue p-6 flex justify-between items-center">
                    <div className="text-white flex items-center gap-3">
                        {selectedFeature.icon}
                        <h3 className="text-xl font-bold font-display">{selectedFeature.title}</h3>
                    </div>
                    <button onClick={() => setSelectedFeature(null)} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8">
                    <h4 className="text-gray-900 font-bold mb-4 text-lg">¿En qué consiste este servicio?</h4>
                    <p className="text-gray-600 leading-relaxed text-base mb-6">
                        {selectedFeature.longDesc}
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-rentia-gold p-4 rounded">
                        <p className="text-xs text-gray-500 italic">
                            * En RentiaRoom trabajamos para minimizar incidencias, pero actuamos como intermediarios de gestión. Los tiempos y resultados pueden depender de terceros o factores externos.
                        </p>
                    </div>
                    <button 
                        onClick={() => setSelectedFeature(null)}
                        className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Final CTA */}
      <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
              <h2 className="text-3xl font-bold text-rentia-black mb-6 font-display">¿Tienes dudas sobre nuestros servicios?</h2>
              <p className="text-xl text-gray-600 mb-8">
                  Contáctanos para conocer en detalle cómo podemos ayudarte a gestionar tu propiedad.
              </p>
              <a 
                href="https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20tengo%20dudas%20sobre%20los%20servicios%20de%20RentiaRoom" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                  <MessageCircle className="w-6 h-6 mr-2" />
                  Contáctanos por WhatsApp
              </a>
          </div>
      </section>

    </div>
  );
};
