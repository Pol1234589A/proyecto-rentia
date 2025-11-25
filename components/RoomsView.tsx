
import React from 'react';
import { ExternalLink, Info, Home, CheckCircle } from 'lucide-react';

export const RoomsView: React.FC = () => {
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative py-24 md:py-36 bg-rentia-black text-white overflow-hidden">
        {/* Background Image - Increased visibility */}
        <div className="absolute inset-0">
           <img
             src="https://rentiaroom.com/wp-content/uploads/2025/06/WhatsApp-Image-2025-05-12-at-09.55.44-1-1024x682.jpeg"
             alt="Habitaciones Disponibles"
             className="w-full h-full object-cover opacity-70"
           />
        </div>
        {/* Lighter Gradient for better image visibility while keeping text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/30 via-rentia-black/50 to-white"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center mt-10">
            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm shadow-lg uppercase tracking-wider">
                <Home className="w-4 h-4" />
                Gestión Integral
            </div>
          <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight drop-shadow-lg text-white">
            HABITACIONES DISPONIBLES
          </h1>
          <p className="text-xl md:text-2xl text-white font-medium max-w-2xl mx-auto drop-shadow-md">
            Encuentra tu próximo hogar con la garantía de calidad RentiaRoom.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 container mx-auto px-4 max-w-4xl text-center relative z-20 -mt-10">
         
         {/* Stats Card */}
         <div className="bg-white rounded-xl shadow-xl p-8 mb-12 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6 text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Disponibilidad Real</span>
                </div>
                <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-rentia-blue rounded-full">
                        <Home className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-rentia-black">+50 Habitaciones en Cartera</span>
                </div>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto mb-8">
                Gestionamos un total de <strong>más de 50 habitaciones</strong>. En el siguiente enlace verás <strong>únicamente las que están libres ahora mismo</strong>. Si no ves opciones, es que el resto están actualmente ocupadas o reservadas.
            </p>

            <a
            href="https://www.idealista.com/pro/rentiaroom/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-rentia-blue hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 text-lg group w-full md:w-auto"
            >
            <span>VER HABITACIONES LIBRES</span>
            <ExternalLink className="ml-3 w-6 h-6 group-hover:rotate-45 transition-transform" />
            </a>
            
            <p className="text-xs text-gray-400 mt-4">
                * Serás redirigido a nuestro perfil oficial en Idealista
            </p>
         </div>
      </section>

      {/* Legal Text */}
      <section className="pb-16 container mx-auto px-4 max-w-4xl">
        <div className="bg-gray-50 p-8 md:p-10 rounded-xl border border-gray-100 text-left shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
             <Info className="w-6 h-6 text-rentia-blue flex-shrink-0" />
             <h3 className="font-bold text-rentia-black text-lg uppercase tracking-wide">Aviso Legal</h3>
          </div>
          <div className="text-gray-600 text-sm space-y-4 leading-relaxed text-justify">
            <p>
              <strong className="text-rentia-black">La información contenida en este sitio web y en los anuncios publicados tiene carácter meramente informativo</strong> y no constituye oferta contractual conforme al artículo 1261 del Código Civil. 
            </p>
            <p>
              Las condiciones finales de cada operación (incluyendo precios, disponibilidad, duración del contrato u honorarios de gestión, si los hubiera) se comunicarán de forma expresa y previa al interesado durante la fase de contacto directo, y podrán variar en función de factores como acuerdos con la propiedad, intervención de colaboradores externos o circunstancias específicas del arrendamiento.
            </p>
            <p className="font-medium text-gray-700">
              Se recomienda consultar cada anuncio individual para verificar los detalles específicos. Nos reservamos el derecho de modificar o actualizar la información sin previo aviso hasta la formalización del contrato.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
