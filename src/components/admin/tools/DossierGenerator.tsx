import { Property } from '../../../data/rooms';
import { generateCompanyConditionsPDF } from '../../../utils/pdfGenerator';
import { useState } from 'react';
import { FileText, Save, Download, RefreshCw, PenTool, Plus, Trash2, Megaphone, CheckCircle, HelpCircle, DollarSign, Users, Building2, ShieldCheck } from 'lucide-react';

export const DossierGenerator: React.FC = () => {
    // State including marketing fields
    const [config, setConfig] = useState<any>({
        type: 'owners', // 'marketing' | 'conditions' | 'owners'
        showCover: true,
        title: 'Propuesta de Gestión RentiaRoom',
        subtitle: 'Gestión Integral y Rentabilidad sin Preocupaciones',
        introText: 'En RentiaRoom nos encargamos de convertir tu vivienda en una inversión eficiente. Nuestra gestión 360º cubre desde la búsqueda del inquilino hasta el mantenimiento técnico, asegurando que tu única tarea sea recibir la renta.',
        referralInfo: 'Plan Amigo Propietario: Recomienda RentiaRoom a otro propietario y obtén condiciones especiales en tu próxima propiedad gestionada.',
        discounts: [
            { apartment: 'Eficacia Operativa', description: 'Nuestros honorarios se devengan exclusivamente sobre las unidades bajo contrato activo.' },
            { apartment: 'Marketing Premium', description: 'Reportaje fotográfico y de vídeo incluido. Publicación en portales líderes (Idealista).' },
            { apartment: 'Transparencia Total', description: 'Gestión de cobros mediante sistema de suplidos con liquidación detallada periódica.' },
            { apartment: 'Soporte Técnico', description: 'Red de colaboradores (Fontanería, Electricidad...) con pago directo del propietario al técnico.' }
        ],
        sections: [
            { id: 1, title: 'Gestión de Inquilinos y Contratos', content: '• Selección y filtrado de candidatos.\n• Generación de contratos legales.\n• Cobros directos de inquilinos a Rentia y transferencia al propietario (descontando comisión).\n• Atención al inquilino de Lunes a Viernes.' },
            { id: 2, title: 'Mantenimiento y Coordinación', content: '• Supervisión periódica de la vivienda.\n• Coordinación con el seguro en caso de incidencias (Seguro obligatorio).\n• Gestión de reparaciones con especialistas de confianza.\n• Coordinación del servicio de limpieza (Abonado por el propietario).' },
            { id: 3, title: 'Comunicación y Administración', content: '• Creación de grupo directo Rentia-Propietario.\n• Grupo Rentia-Inquilinos (El propietario puede decidir si estar presente o no).\n• Cálculo de consumos de suministros y reparto entre inquilinos.\n• Preparación de facturas y reportes de gastos.' }, ,
            { id: 4, title: 'Requisitos para el Registro', content: '• Referencia Catastral y Dirección Exacta.\n• Datos fiscales y contacto para notificaciones.\n• Cédula de habitabilidad y Certificado Energético en vigor.\n• Declaración de daños internos o comunitarios.\n• Cerraduras con llave en todas las habitaciones.\n• Notificación previa a vecinos y suministros en correcto funcionamiento.\n• Definición de normas comunitarias (ej. uso de terraza).' },
            { id: 5, title: 'Convivencia y Mediación', content: '• Intermediación activa en la resolución de conflictos básicos entre inquilinos.\n• Normas claras de convivencia especificadas legalmente en cada contrato.\n• Instalación de cartelería física en la vivienda con las normas y protocolos de la casa.\n• Supervisión del cumplimiento de las normas de la comunidad de vecinos.' }
        ],
        roadmap: [
            { title: 'Confirmación y Registro', description: 'Revisión de documentación (Cédula, Catastro) y firma de acuerdo de gestión.' },
            { title: 'Puesta a Punto', description: 'Visita técnica, reportaje de fotos/vídeo y coordinación de limpieza post-obra (si aplica).' },
            { title: 'Lanzamiento', description: 'Publicación destacada en Idealista y filtrado exhaustivo de candidatos.' },
            { title: 'Gestión Activa', description: 'Firma de contratos, creación de grupos de comunicación y mantenimiento semanal.' }
        ],
        investorTables: true,
        footerText: 'Www.rentiaroom.com • Tu confianza, nuestra prioridad.'
    });

    const setMode = (mode: string) => {
        if (mode === 'owners') {
            setConfig({
                type: 'owners',
                showCover: true,
                title: 'Propuesta de Gestión RentiaRoom',
                subtitle: 'Gestión Integral y Rentabilidad sin Preocupaciones',
                introText: 'Transformamos tu propiedad en una inversión eficiente. Nos encargamos de todo el flujo operativo y administrativo.',
                referralInfo: 'Plan Amigo Propietario: Recomienda a otro propietario y recibe beneficios exclusivos en tu cartera.',
                discounts: [
                    { apartment: 'Compromiso de Éxito', description: 'Solo devengamos honorarios por habitaciones con contrato activo.' },
                    { apartment: 'Visibilidad Top', description: 'Fotos 4K, vídeos y posicionamiento preferente en Idealista.' },
                    { apartment: 'Pagos Transparentes', description: 'Liquidación periódica de rentas mediante sistema contable de suplidos.' },
                    { apartment: 'Gestión Técnica', description: 'Coordinación integral de especialistas y comunicación con seguros.' }
                ],
                sections: [
                    { id: 1, title: 'Operativa de Alquiler', content: '• Publicación en Idealista y otras plataformas.\n• Generación de contratos y filtrado de perfiles.\n• Gestión de pagos e impagos.' },
                    { id: 2, title: 'Mantenimiento Técnico', content: '• Red de fontaneros y electricistas propia (pago directo).\n• Coordinación obligatoria con seguros.\n• Supervisión de estado de la vivienda.' },
                    { id: 3, title: 'Administración y Grupos', content: '• Grupos de comunicación independientes (Propietarios e Inquilinos).\n• Cálculo y gestión de suministros mensuales.\n• Atención profesional de Lunes a Viernes.' },
                    { id: 4, title: 'Checklist de Registro', content: '• Ref. Catastral, Dirección y Cédula de Habitabilidad.\n• Certificado Energético y estado de suministros.\n• Cerraduras en todas las puertas y declaración de daños.' },
                    { id: 5, title: 'Normas y Convivencia', content: '• Carteles informativos con normas en la vivienda.\n• Normas integradas en el contrato de alquiler.\n• Mediación activa en conflictos de convivencia.' }
                ],
                roadmap: [
                    { title: 'Confirmación', description: 'Validación de documentos y alta en sistema.' },
                    { title: 'Reportaje', description: 'Visita, fotos 4K y vídeo para portales.' },
                    { title: 'Limpieza', description: 'Coordinación de limpieza inicial y mantenimiento semanal.' },
                    { title: 'Marketing', description: 'Publicación en Idealista y filtrado de candidatos.' }
                ],
                investorTables: true,
                footerText: 'Www.rentiaroom.com • Gestión Patrimonial Transparente.'
            });
        } else if (mode === 'marketing') {
            setConfig({
                type: 'marketing',
                showCover: true,
                title: 'Dossier Comercial 2026',
                subtitle: 'Tu Nueva Habitación con RentiaRoom',
                introText: 'Descubre por qué cientos de jóvenes eligen RentiaRoom. No solo alquilamos habitaciones, creamos hogares.',
                referralInfo: 'Trae a un amigo y ambos recibiréis un descuento del 10% en vuestra próxima mensualidad.',
                discounts: [
                    { apartment: 'Calle Asunción', description: '5€ de descuento directo.' }
                ],
                sections: [
                    { id: 1, title: 'Servicios Premium', content: '• WiFi Alta Velocidad\n• Limpieza de zonas comunes' }
                ],
                footerText: 'Www.rentiaroom.com • Tu espacio, tus reglas.'
            });
        } else {
            setConfig({
                ...config,
                type: 'conditions',
                title: 'Condiciones Generales',
                subtitle: 'Normativa interna RentiaRoom'
            });
        }
    };

    const updateSection = (id: number, field: 'title' | 'content', value: string) => {
        setConfig((prev: any) => ({
            ...prev,
            sections: prev.sections.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const addDiscount = () => {
        setConfig((prev: any) => ({
            ...prev,
            discounts: [...prev.discounts, { apartment: '', description: '' }]
        }));
    };

    const removeDiscount = (index: number) => {
        setConfig((prev: any) => ({
            ...prev,
            discounts: prev.discounts.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateDiscount = (index: number, field: string, value: string) => {
        const newDiscounts = [...config.discounts];
        newDiscounts[index][field] = value;
        setConfig({ ...config, discounts: newDiscounts });
    };

    const handleGenerate = () => {
        generateCompanyConditionsPDF(config);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-rentia-blue/10 p-3 rounded-xl border border-rentia-blue/20">
                        <Building2 className="w-6 h-6 text-rentia-blue" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            Generador de Dossiers Rentia
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Crea documentos para Propietarios, Inquilinos o Empresa.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg border mr-2">
                        <button
                            onClick={() => setMode('owners')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${config.type === 'owners' ? 'bg-white text-rentia-blue shadow-sm border border-gray-100' : 'text-gray-500'}`}
                        >
                            PROPIETARIOS
                        </button>
                        <button
                            onClick={() => setMode('marketing')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${config.type === 'marketing' ? 'bg-white text-rentia-blue shadow-sm border border-gray-100' : 'text-gray-500'}`}
                        >
                            INQUILINOS
                        </button>
                        <button
                            onClick={() => setMode('conditions')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${config.type === 'conditions' ? 'bg-white text-rentia-blue shadow-sm border border-gray-100' : 'text-gray-500'}`}
                        >
                            CONDICIONES
                        </button>
                    </div>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-2 bg-rentia-blue hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 shadow-blue-500/20"
                    >
                        <Download className="w-4 h-4" /> Generar PDF
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto flex-grow bg-gray-50/50">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

                    {/* LEFT: MAIN CONFIG */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Cabecera */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b">
                                <PenTool className="w-4 h-4" /> Portada y General
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 flex items-center gap-3 bg-blue-50 p-2 rounded-lg border border-blue-100 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={config.showCover}
                                        onChange={(e) => setConfig({ ...config, showCover: e.target.checked })}
                                        className="w-4 h-4 border-gray-300 rounded text-rentia-blue focus:ring-rentia-blue"
                                        id="showCover"
                                    />
                                    <label htmlFor="showCover" className="text-xs font-bold text-blue-700 cursor-pointer">Incluir página de portada con diseño premium</label>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Título Principal</label>
                                    <input type="text" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm font-bold bg-white" title="Título Principal" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Subtítulo</label>
                                    <input type="text" value={config.subtitle} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm font-bold bg-white" title="Subtítulo" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Texto de Bienvenida</label>
                                    <textarea value={config.introText} onChange={(e) => setConfig({ ...config, introText: e.target.value })} rows={2} className="w-full p-2.5 border rounded-xl text-sm font-medium bg-white" title="Texto de Introducción" />
                                </div>
                            </div>
                        </div>

                        {/* DESCUENTOS / GARANTÍAS */}
                        {(config.type === 'marketing' || config.type === 'owners') && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-emerald-500" /> {config.type === 'owners' ? 'Propuesta de Valor' : 'Promociones por Piso'}
                                    </h4>
                                    <button onClick={addDiscount} className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> AÑADIR PUNTO
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {config.discounts.map((d: any, i: number) => (
                                        <div key={i} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                            <input
                                                className="w-1/3 bg-white border-none rounded-lg text-xs font-black p-2 shadow-sm"
                                                value={d.apartment}
                                                onChange={(e) => updateDiscount(i, 'apartment', e.target.value)}
                                                placeholder="Concepto..."
                                                title="Piso"
                                            />
                                            <input
                                                className="flex-1 bg-white border-none rounded-lg text-xs font-medium p-2 shadow-sm"
                                                value={d.description}
                                                onChange={(e) => updateDiscount(i, 'description', e.target.value)}
                                                placeholder="Detalle..."
                                                title="Descripción"
                                            />
                                            <button onClick={() => removeDiscount(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Eliminar Item">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SECCIONES EDITABLES */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b">
                                <FileText className="w-4 h-4" /> Secciones Informativas
                            </h4>
                            <div className="space-y-6">
                                {config.sections.map((section: any, idx: number) => (
                                    <div key={section.id} className="relative pl-6 border-l-2 border-slate-100 py-2">
                                        <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-slate-300"></div>
                                        <div className="space-y-2">
                                            <input
                                                className="w-full text-sm font-black text-slate-800 border-none bg-transparent outline-none p-0 focus:text-rentia-blue"
                                                value={section.title}
                                                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                                placeholder="Título de la Sección"
                                                title="Título Sección"
                                            />
                                            <textarea
                                                className="w-full text-xs font-medium text-slate-500 border border-slate-100 rounded-xl bg-slate-50/50 p-3 outline-none focus:bg-white focus:border-slate-200"
                                                value={section.content}
                                                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                                rows={3}
                                                placeholder="Escribe aquí los detalles..."
                                                title="Contenido Sección"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ROADMAP / PROCESO (Solo Propietarios) */}
                        {config.type === 'owners' && config.roadmap && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b">
                                    <RefreshCw className="w-4 h-4 text-blue-500" /> Línea de Tiempo del Proceso
                                </h4>
                                <div className="space-y-4">
                                    {config.roadmap.map((step: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <div className="w-8 h-8 rounded-full bg-rentia-blue text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    className="w-full bg-transparent text-xs font-black text-slate-800 outline-none border-b border-blue-100 pb-1"
                                                    value={step.title}
                                                    onChange={(e) => {
                                                        const newRoadmap = [...config.roadmap];
                                                        newRoadmap[i].title = e.target.value;
                                                        setConfig({ ...config, roadmap: newRoadmap });
                                                    }}
                                                    placeholder="Título Paso..."
                                                    title="Título Paso"
                                                />
                                                <input
                                                    className="w-full bg-transparent text-[10px] text-slate-500 outline-none"
                                                    value={step.description}
                                                    onChange={(e) => {
                                                        const newRoadmap = [...config.roadmap];
                                                        newRoadmap[i].description = e.target.value;
                                                        setConfig({ ...config, roadmap: newRoadmap });
                                                    }}
                                                    placeholder="Breve descripción..."
                                                    title="Descripción Paso"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: SECONDARY CONFIG */}
                    <div className="space-y-6">

                        {/* REFERIDOS / PLAN AMIGO */}
                        {(config.type === 'marketing' || config.type === 'owners') && (
                            <div className="bg-indigo-900 rounded-2xl shadow-xl p-6 text-white border border-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10 space-y-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 opacity-80">
                                        <Users className="w-4 h-4" /> {config.type === 'owners' ? 'Plan Amigo Propietario' : 'Programa Referidos'}
                                    </h4>
                                    <textarea
                                        value={config.referralInfo}
                                        onChange={(e) => setConfig({ ...config, referralInfo: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-indigo-100 outline-none focus:bg-white/20 h-32"
                                        placeholder="Detalles sobre beneficios por recomendaciones..."
                                        title="Información Referidos"
                                    />
                                    <div className="flex items-center gap-2 text-[10px] text-indigo-200/60 italic">
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Aparecerá resaltado en el PDF.
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                            </div>
                        )}

                        {/* Pie de Página */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">Pie de Documento</h4>
                            <input
                                value={config.footerText}
                                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                                className="w-full p-2.5 border rounded-xl text-xs font-medium bg-slate-50"
                                title="Texto de Pie"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
