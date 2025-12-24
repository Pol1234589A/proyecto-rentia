
import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { HomePageContent } from '../../types';
import { ImageUploader } from './ImageUploader';
import { Save, Loader2, Layout, Type, Image as ImageIcon, Eye, Monitor, Smartphone, Palette, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// PREVIEW COMPONENTS (Simplified versions of the real ones)
const HeroPreview: React.FC<{ content: HomePageContent['hero'] }> = ({ content }) => (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center text-center text-white bg-gray-900">
        <div className="absolute inset-0 z-0">
             <img src={content.backgroundImage} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black" style={{ opacity: content.overlayOpacity }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 p-8 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-display leading-tight drop-shadow-lg">
                {content.titlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-yellow-200">{content.titleHighlight}</span>
            </h1>
            <p className="text-sm md:text-lg opacity-90 mb-8 font-light drop-shadow-md">{content.subtitle}</p>
            <div className="flex gap-4 justify-center">
                <button className="bg-rentia-blue text-white px-6 py-2 rounded-lg font-bold shadow-lg">{content.ctaPrimary}</button>
                <button className="bg-white/10 backdrop-blur border border-white/30 text-white px-6 py-2 rounded-lg font-bold">{content.ctaSecondary}</button>
            </div>
        </div>
    </div>
);

const SolutionsPreview: React.FC<{ content: HomePageContent['solutions'] }> = ({ content }) => (
    <div className="bg-white p-8 h-full overflow-y-auto">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-rentia-black mb-2 font-display">{content.title}</h2>
            <p className="text-gray-500 text-sm">{content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-50 text-rentia-blue rounded-xl flex items-center justify-center mb-4 font-bold text-xl">1</div>
                  <h3 className="font-bold text-lg mb-2">{content.card1Title}</h3>
                  <p className="text-xs text-gray-500">{content.card1Desc}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-yellow-50 text-rentia-gold rounded-xl flex items-center justify-center mb-4 font-bold text-xl">2</div>
                  <h3 className="font-bold text-lg mb-2">{content.card2Title}</h3>
                  <p className="text-xs text-gray-500">{content.card2Desc}</p>
             </div>
        </div>
    </div>
);

const CTAPreview: React.FC<{ content: HomePageContent['cta'] }> = ({ content }) => (
    <div className="bg-gray-50 p-8 h-full flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl w-full flex flex-col md:flex-row">
            <div className="p-6 flex-1 flex flex-col justify-center">
                <h2 className="text-xl font-bold mb-3 text-rentia-black font-display">{content.title}</h2>
                <p className="text-sm text-gray-600 mb-6">{content.subtitle}</p>
                <button className="bg-rentia-blue text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md w-fit flex items-center gap-2">
                    {content.buttonText} <ArrowRight className="w-4 h-4"/>
                </button>
            </div>
            <div className="md:w-1/2 h-40 md:h-auto relative">
                <img src={content.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10"></div>
            </div>
        </div>
    </div>
);

export const VisualEditor: React.FC = () => {
    const { home, loading } = useContent();
    const [activeSection, setActiveSection] = useState<'hero' | 'solutions' | 'cta'>('hero');
    const [draftContent, setDraftContent] = useState<HomePageContent>(home);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Sync draft with context load
    useEffect(() => {
        if (!loading) setDraftContent(home);
    }, [home, loading]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "app_config", "content"), { home: draftContent }, { merge: true });
            alert("Cambios publicados en la web.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const updateHero = (field: keyof HomePageContent['hero'], value: any) => {
        setDraftContent(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    };
    
    const updateSolutions = (field: keyof HomePageContent['solutions'], value: any) => {
        setDraftContent(prev => ({ ...prev, solutions: { ...prev.solutions, [field]: value } }));
    };

    const updateCTA = (field: keyof HomePageContent['cta'], value: any) => {
        setDraftContent(prev => ({ ...prev, cta: { ...prev.cta, [field]: value } }));
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

    return (
        <div className="h-full flex flex-col bg-gray-100 overflow-hidden">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                        <Layout className="w-5 h-5 text-rentia-blue" /> Editor Visual Web
                    </h2>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('desktop')} className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}><Monitor className="w-4 h-4"/></button>
                        <button onClick={() => setViewMode('mobile')} className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}><Smartphone className="w-4 h-4"/></button>
                    </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-rentia-black text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Publicar Cambios
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-grow flex overflow-hidden">
                
                {/* Left Sidebar: Layers / Properties */}
                <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-10 shadow-[4px_0_15px_rgba(0,0,0,0.03)]">
                    
                    {/* Layer Selector */}
                    <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                        <button onClick={() => setActiveSection('hero')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSection === 'hero' ? 'border-rentia-blue text-rentia-blue bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Hero / Portada</button>
                        <button onClick={() => setActiveSection('solutions')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSection === 'solutions' ? 'border-rentia-blue text-rentia-blue bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Soluciones</button>
                        <button onClick={() => setActiveSection('cta')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSection === 'cta' ? 'border-rentia-blue text-rentia-blue bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>CTA Final</button>
                    </div>

                    {/* Properties Panel */}
                    <div className="p-6 space-y-6">
                        
                        {activeSection === 'hero' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Type className="w-3 h-3"/> Textos</h4>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">Prefijo Título</label>
                                        <input type="text" className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors" value={draftContent.hero.titlePrefix} onChange={e => updateHero('titlePrefix', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">Título Destacado (Gradiente)</label>
                                        <input type="text" className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors font-bold text-rentia-gold" value={draftContent.hero.titleHighlight} onChange={e => updateHero('titleHighlight', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">Subtítulo</label>
                                        <textarea className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white h-24 resize-none transition-colors" value={draftContent.hero.subtitle} onChange={e => updateHero('subtitle', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-xs font-bold text-gray-600 block mb-1">Botón 1</label><input type="text" className="w-full p-2 border rounded text-xs" value={draftContent.hero.ctaPrimary} onChange={e => updateHero('ctaPrimary', e.target.value)} /></div>
                                        <div><label className="text-xs font-bold text-gray-600 block mb-1">Botón 2</label><input type="text" className="w-full p-2 border rounded text-xs" value={draftContent.hero.ctaSecondary} onChange={e => updateHero('ctaSecondary', e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Fondo & Estilo</h4>
                                    <ImageUploader folder="web/hero" label="Cambiar Imagen Fondo" compact={false} onUploadComplete={(url) => updateHero('backgroundImage', url)} onlyFirebase={true} />
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1 flex justify-between"><span>Opacidad Oscura</span> <span>{draftContent.hero.overlayOpacity}</span></label>
                                        <input type="range" min="0" max="1" step="0.1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={draftContent.hero.overlayOpacity} onChange={e => updateHero('overlayOpacity', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'solutions' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                 <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Título Sección</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm" value={draftContent.solutions.title} onChange={e => updateSolutions('title', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Subtítulo</label>
                                    <textarea className="w-full p-2 border rounded text-sm h-16 resize-none" value={draftContent.solutions.subtitle} onChange={e => updateSolutions('subtitle', e.target.value)} />
                                </div>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <h5 className="text-xs font-bold text-blue-600 uppercase mb-2">Tarjeta 1</h5>
                                    <input type="text" className="w-full p-2 border rounded text-sm mb-2" value={draftContent.solutions.card1Title} onChange={e => updateSolutions('card1Title', e.target.value)} />
                                    <textarea className="w-full p-2 border rounded text-xs h-16" value={draftContent.solutions.card1Desc} onChange={e => updateSolutions('card1Desc', e.target.value)} />
                                </div>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <h5 className="text-xs font-bold text-yellow-600 uppercase mb-2">Tarjeta 2</h5>
                                    <input type="text" className="w-full p-2 border rounded text-sm mb-2" value={draftContent.solutions.card2Title} onChange={e => updateSolutions('card2Title', e.target.value)} />
                                    <textarea className="w-full p-2 border rounded text-xs h-16" value={draftContent.solutions.card2Desc} onChange={e => updateSolutions('card2Desc', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {activeSection === 'cta' && (
                             <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                 <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Título</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm" value={draftContent.cta.title} onChange={e => updateCTA('title', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Descripción</label>
                                    <textarea className="w-full p-2 border rounded text-sm h-24" value={draftContent.cta.subtitle} onChange={e => updateCTA('subtitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-1">Texto Botón</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm" value={draftContent.cta.buttonText} onChange={e => updateCTA('buttonText', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-2">Imagen Lateral</label>
                                    <ImageUploader folder="web/cta" label="Cambiar Imagen" compact={false} onUploadComplete={(url) => updateCTA('image', url)} onlyFirebase={true} />
                                </div>
                             </div>
                        )}

                    </div>
                </div>

                {/* Right: Live Canvas */}
                <div className="flex-grow bg-gray-200 p-8 flex items-center justify-center overflow-auto relative">
                    {/* Grid Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    <div 
                        className={`bg-white shadow-2xl transition-all duration-500 ease-in-out border-[8px] border-gray-800 rounded-[2rem] overflow-hidden relative ${
                            viewMode === 'desktop' ? 'w-full h-full max-w-[1400px] max-h-[800px] rounded-lg border-4' : 'w-[375px] h-[750px]'
                        }`}
                    >
                        {/* Fake Browser UI for Desktop */}
                        {viewMode === 'desktop' && (
                            <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-grow text-center text-[10px] text-gray-400 font-mono">rentiaroom.com</div>
                            </div>
                        )}

                        {/* Render Active Component Preview */}
                        <div className="w-full h-full overflow-y-auto bg-white relative">
                            {activeSection === 'hero' && <HeroPreview content={draftContent.hero} />}
                            {activeSection === 'solutions' && <SolutionsPreview content={draftContent.solutions} />}
                            {activeSection === 'cta' && <CTAPreview content={draftContent.cta} />}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
