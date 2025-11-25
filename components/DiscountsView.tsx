
import React from 'react';
import { Percent, Building, Users, Info } from 'lucide-react';

export const DiscountsView: React.FC = () => {
  const volumeDiscounts = [
    { tier: '1 VIVIENDA', rate: '15% + IVA' },
    { tier: '2 VIVIENDAS', rate: '14% + IVA' },
    { tier: '3-5 VIVIENDAS', rate: '13% + IVA' },
    { tier: '6-10 VIVIENDAS', rate: '12% + IVA' },
    { tier: '+ 10 VIVIENDAS', rate: '10% + IVA' },
  ];

  const referralDiscount = {
    tier: 'POR INVERSOR REFERIDO',
    rate: '0,5% + IVA',
  };

  return (
    <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative py-24 bg-rentia-black overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="https://images.unsplash.com/photo-1579621970795-87f54f59009f?auto=format&fit=crop&w=1600&q=80" 
            alt="Descuentos para inversores RentiaRoom" 
            className="w-full h-full object-cover grayscale opacity-60"
          />
          <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm shadow-lg uppercase tracking-wider">
            <Percent className="w-4 h-4" />
            Plan de Bonificaciones
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
            Tablas de Descuentos para Inversores
          </h1>
          <p className="text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
            Premiamos tu confianza y volumen. Cuantas más propiedades gestiones con nosotros, mayores serán tus beneficios.
          </p>
        </div>
      </section>

      {/* Tables Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            
            {/* Volume Discounts Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-rentia-blue text-white p-4">
                <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2 uppercase tracking-wider">
                  <Building className="w-5 h-5" />
                  Descuento por Viviendas Propias
                </h3>
              </div>
              <table className="w-full text-center">
                <tbody>
                  {volumeDiscounts.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 last:border-b-0">
                      <td className="py-4 px-6 font-medium text-gray-700 w-1/2">{item.tier}</td>
                      <td className="py-4 px-6 font-bold text-rentia-black bg-gray-50/70 w-1/2">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Referral Discounts Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-rentia-blue text-white p-4">
                <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2 uppercase tracking-wider">
                  <Users className="w-5 h-5" />
                  Descuento por Referidos
                </h3>
              </div>
              <table className="w-full text-center">
                <tbody>
                  <tr className="border-b border-gray-200 last:border-b-0">
                    <td className="py-4 px-6 font-medium text-gray-700 w-1/2">{referralDiscount.tier}</td>
                    <td className="py-4 px-6 font-bold text-rentia-black bg-gray-50/70 w-1/2">{referralDiscount.rate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Conditions Text */}
          <div className="mt-12 bg-white border border-gray-200 p-6 rounded-lg text-gray-700 shadow-md">
            <div className="flex items-start gap-4">
              <Info className="w-8 h-8 text-rentia-blue flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-rentia-black mb-2">Condiciones de los descuentos</h4>
                <p className="leading-relaxed text-sm">
                  Los descuentos se aplican al total de viviendas en <strong>gestión activa</strong>. Las bonificaciones por volumen y por referidos son <strong>acumulables</strong>, con un límite conjunto del <strong>10% + IVA</strong> sobre la comisión de gestión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
