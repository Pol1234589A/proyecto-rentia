"use client";

import React, { useState } from 'react';
import { Percent, Building, Users, Calculator, ArrowRight, RefreshCw, Wallet, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext'; // NEW
import { MaintenanceOverlay } from './common/MaintenanceOverlay'; // NEW

export const DiscountsView: React.FC = () => {
  const [numProperties, setNumProperties] = useState<number>(1);
  const [numReferrals, setNumReferrals] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const { t } = useLanguage();
  const config = useConfig(); // NEW

  // Constantes de cálculo
  const BASE_RATE = 15; // 15% para 1 vivienda
  const MIN_RATE = 10;  // Suelo del 10%

  const calculateRate = () => {
    let volumeRate = 15;

    // Descuento por volumen
    if (numProperties === 1) volumeRate = 15;
    else if (numProperties === 2) volumeRate = 14;
    else if (numProperties >= 3 && numProperties <= 5) volumeRate = 13;
    else if (numProperties >= 6 && numProperties <= 10) volumeRate = 12;
    else if (numProperties > 10) volumeRate = 10;

    // Descuento por referidos (0.5% por referido)
    const referralDiscount = numReferrals * 0.5;

    // Cálculo final
    let finalRate = volumeRate - referralDiscount;

    // Aplicar límite suelo (no bajar del 10% salvo excepción muy especial)
    if (finalRate < MIN_RATE) finalRate = MIN_RATE;

    return {
      base: BASE_RATE,
      volume: volumeRate,
      final: finalRate,
      savings: BASE_RATE - finalRate
    };
  };

  const handleCalculate = () => {
    setShowResult(true);
    // Scroll suave hacia el resultado
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const resetCalculator = () => {
    setNumProperties(1);
    setNumReferrals(0);
    setShowResult(false);
  };

  const result = calculateRate();

  // Estimación de ahorro anual (suponiendo un alquiler medio de 1500€/mes por propiedad)
  const averageRent = 1500;
  const yearlySavings = ((result.base - result.final) / 100) * averageRent * 12 * numProperties;

  return (
    <MaintenanceOverlay isActive={config.modules.maintenanceDiscounts} title="Calculadora en Mantenimiento">
      <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">
        {/* Hero Section */}
        <section className="relative py-20 bg-rentia-black overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80"
              alt="Calculadora Rentabilidad"
              className="w-full h-full object-cover grayscale opacity-40"
            />
            <div className="absolute inset-0 bg-rentia-blue/80 mix-blend-multiply"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm shadow-lg uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              {t('discounts.hero.badge')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
              {t('discounts.hero.title')}
            </h1>
            <p className="text-lg text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
              {t('discounts.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

              {/* Header Calculadora */}
              <div className="bg-gray-50 border-b border-gray-200 p-6 text-center">
                <h2 className="text-xl font-bold text-rentia-black">{t('discounts.calc.header')}</h2>
              </div>

              <div className="p-8 md:p-12 space-y-10">

                {/* Pregunta 1: Propiedades */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Building className="w-6 h-6 text-rentia-blue" />
                    {t('discounts.calc.q1')}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={numProperties}
                      onChange={(e) => { setNumProperties(parseInt(e.target.value)); setShowResult(false); }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rentia-blue"
                    />
                    <div className="w-20 h-12 flex items-center justify-center bg-blue-50 border-2 border-blue-100 rounded-xl font-bold text-2xl text-rentia-blue">
                      {numProperties}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {numProperties === 1 ? t('discounts.calc.h1') : numProperties > 10 ? t('discounts.calc.h3') : t('discounts.calc.h2')}
                  </p>
                </div>

                {/* Pregunta 2: Referidos */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-rentia-gold" />
                    {t('discounts.calc.q2')}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { setNumReferrals(Math.max(0, numReferrals - 1)); setShowResult(false); }}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <div className="w-20 h-12 flex items-center justify-center bg-yellow-50 border-2 border-yellow-100 rounded-xl font-bold text-2xl text-rentia-black">
                      {numReferrals}
                    </div>
                    <button
                      onClick={() => { setNumReferrals(numReferrals + 1); setShowResult(false); }}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('discounts.calc.h_ref')}
                  </p>
                </div>

                {/* Action Button */}
                {!showResult && (
                  <div className="pt-4">
                    <button
                      onClick={handleCalculate}
                      className="w-full bg-rentia-black text-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-gray-800 transition-all shadow-lg transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <Calculator className="w-5 h-5" />
                      {t('discounts.calc.btn')}
                    </button>
                  </div>
                )}
              </div>

              {/* --- RESULT CARD --- */}
              {showResult && (
                <div id="result-section" className="bg-rentia-blue p-8 md:p-12 text-white animate-in slide-in-from-bottom-10 duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold font-display mb-2">{t('discounts.result.title')}</h3>
                        <p className="text-blue-100 text-sm">Based on {numProperties} properties and {numReferrals} referrals.</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-white/20 pb-2">
                          <span className="text-blue-100">{t('discounts.result.std_rate')}</span>
                          <span className="font-medium line-through text-white/60">{BASE_RATE}% + IVA</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-lg">{t('discounts.result.your_rate')}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl md:text-5xl font-bold text-rentia-gold">{result.final}%</span>
                            <span className="text-sm font-medium text-rentia-gold">+ IVA</span>
                          </div>
                        </div>
                      </div>

                      {yearlySavings > 0 && (
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex items-center gap-4">
                          <div className="p-3 bg-green-500 rounded-full text-white shadow-lg">
                            <Wallet className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-100 uppercase tracking-wider font-bold">{t('discounts.result.savings')}</p>
                            <p className="text-xl font-bold text-white">{yearlySavings.toLocaleString('es-ES')} € / {t('common.year')}</p>
                            <p className="text-[10px] text-blue-200">{t('discounts.result.savings_note')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3 min-w-[250px]">
                      <a
                        href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20he%20calculado%20mi%20tarifa%20web%20y%20me%20sale%20un%20${result.final}%25.%20Tengo%20${numProperties}%20propiedades.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-rentia-gold hover:bg-yellow-400 text-rentia-black font-bold py-4 px-6 rounded-xl transition-all text-center shadow-lg flex items-center justify-center gap-2"
                      >
                        {t('discounts.result.btn_start')} <ArrowRight className="w-5 h-5" />
                      </a>
                      <button
                        onClick={resetCalculator}
                        className="bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-xl transition-all text-center flex items-center justify-center gap-2 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" /> {t('discounts.result.btn_recalc')}
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Conditions Text */}
            <div className="mt-12 bg-white border border-gray-200 p-6 rounded-lg text-gray-700 shadow-md max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <Info className="w-8 h-8 text-rentia-blue flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-rentia-black mb-2">{t('discounts.conditions.title')}</h4>
                  <p className="leading-relaxed text-sm">
                    {t('discounts.conditions.text')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </MaintenanceOverlay>
  );
};
