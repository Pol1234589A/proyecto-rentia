
import React from 'react';
import { Users, Briefcase, Heart, Quote, TrendingUp, Home, User } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-rentia-black text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
            <img 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80" 
                alt="Equipo RentiaRoom" 
                className="w-full h-full object-cover opacity-30 grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/90 via-rentia-black/70 to-white"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center mt-8">
           <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-rentia-gold font-bold uppercase tracking-wider text-xs mb-4">
              Nuestra Historia
           </span>
           <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 drop-shadow-xl text-white">
             La unión de dos trayectorias
           </h1>
           <p className="text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
             Gestión de activos inmobiliarios con un enfoque práctico y directo.
           </p>
        </div>
      </section>

      {/* --- OUR STORY --- */}
      <section className="py-20 container mx-auto px-4 -mt-12 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                      <h2 className="text-3xl font-bold text-rentia-black font-display mb-6">El Origen de RentiaRoom</h2>
                      <div className="space-y-5 text-gray-600 leading-relaxed text-lg text-justify">
                          <p>
                              <strong>RentiaRoom</strong> surge de la colaboración entre <strong>Pol</strong> y <strong>Víctor Ondoño</strong>. Pol provenía del sector del Personal Shopper Inmobiliario (PSI) trabajando de forma individual, mientras que Víctor venía del ámbito de la gestión de alquileres vacacionales.
                          </p>
                          <p>
                              Ambos decidieron unir sus caminos y formas de trabajar para crear un proyecto conjunto enfocado en la gestión de alquileres.
                          </p>
                          <p className="bg-gray-50 p-4 rounded-lg border-l-4 border-rentia-gold italic text-gray-700">
                              "Agradecemos a todas las personas que han trabajado con nosotros y a los propietarios que han confiado en nuestra gestión desde el inicio."
                          </p>
                      </div>
                  </div>
                  
                  <div className="relative order-1 lg:order-2">
                      {/* IMAGEN DE GRUPO (POL Y VÍCTOR) */}
                      <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gray-100 relative group rotate-1 hover:rotate-0 transition-transform duration-500">
                          <img 
                              src="https://i.ibb.co/zT3d68yG/Whats-App-Image-2025-11-21-at-00-46-35-1.jpg" 
                              alt="Pol y Víctor - Fundadores" 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs hidden md:block z-10">
                          <Quote className="w-8 h-8 text-rentia-gold mb-2" />
                          <p className="text-rentia-black font-bold text-sm italic">
                              "Unimos la visión financiera y la gestión operativa diaria."
                          </p>
                      </div>
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-rentia-blue/10 rounded-full blur-xl -z-10"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- THE TEAM --- */}
      <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-rentia-black font-display mb-4">Quiénes Somos</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                      El equipo humano detrás de la gestión.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  
                  {/* POL */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-black rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <TrendingUp className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Pol</h3>
                               <p className="text-rentia-gold text-xs font-bold uppercase tracking-wide mt-1">Co-fundador y Gerente</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                             Co fundador y gerente de la empresa. Encargado de la captación de inmuebles, relación con inversores, mejoras en procesos, gestión de las propiedades y apoyo en otras tareas.
                          </p>
                      </div>
                  </div>

                  {/* VÍCTOR */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-black rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <Home className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Víctor Ondoño</h3>
                               <p className="text-rentia-gold text-xs font-bold uppercase tracking-wide mt-1">Co-fundador</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                              Co fundador, estrategia, apoyo en procesos, captación y apoyo en otras tareas.
                          </p>
                      </div>
                  </div>

                  {/* SANDRA */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-blue rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <Briefcase className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Sandra</h3>
                               <p className="text-rentia-blue text-xs font-bold uppercase tracking-wide mt-1">Administración</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                              Administración, secretaría, relación con el propietario, gestión activa de las propiedades.
                          </p>
                      </div>
                  </div>

              </div>
          </div>
      </section>

      {/* --- VALUES / GRATITUDE --- */}
      <section className="py-24 bg-rentia-blue text-white relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-rentia-gold/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
              <div className="inline-flex p-4 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/10">
                  <Heart className="w-8 h-8 text-rentia-gold fill-current" />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-8 leading-tight">
                  Gracias por la confianza
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                      <h3 className="text-xl font-bold text-rentia-gold mb-4">A nuestros colaboradores</h3>
                      <p className="text-blue-50 leading-relaxed">
                          "Agradecemos a todas las personas que han trabajado y colaborado con nosotros."
                      </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                      <h3 className="text-xl font-bold text-rentia-gold mb-4">A los propietarios</h3>
                      <p className="text-blue-50 leading-relaxed">
                          "Gracias a los propietarios que han confiado en nuestra gestión."
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 bg-white text-center">
          <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-rentia-black mb-8 font-display">¿Hablamos?</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="https://api.whatsapp.com/send?phone=34672886369" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-rentia-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                      <Briefcase className="w-5 h-5 mr-2" />
                      Contactar con Dirección
                  </a>
                   <a 
                    href="https://api.whatsapp.com/send?phone=34611948589" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-white text-rentia-black border-2 border-gray-200 px-8 py-4 rounded-xl font-bold hover:border-rentia-black transition-all"
                  >
                      Contactar con Administración
                  </a>
              </div>
          </div>
      </section>

    </div>
  );
};
