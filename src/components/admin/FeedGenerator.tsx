
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Rss, Download, Copy, Check, Loader2, Globe, RefreshCw, Layers, ExternalLink, Mail, Facebook, CloudUpload, Link as LinkIcon, Server, Settings, Key, Database, Zap, AlertCircle, Trash2, CheckCircle, XCircle, ChevronDown, ChevronRight, Home, Building2, HelpCircle } from 'lucide-react';
import { Property } from '../../data/rooms';
import { Opportunity } from '../../types';

type PortalId = 'idealista' | 'facebook' | 'trovit' | 'mitula' | 'nestoria' | 'nuroa';

interface PortalConfig {
    id: PortalId;
    name: string;
    rootTag: string;
    email: string;
    color: string;
    desc: string;
    icon?: React.ReactNode;
}

const PORTALS: PortalConfig[] = [
    {
        id: 'idealista',
        name: 'Idealista',
        rootTag: 'pack',
        email: 'info@idealista.com',
        color: 'bg-lime-100 text-lime-800 border-lime-300',
        desc: 'Requiere código ILC. Sincronización diaria automática mediante URL XML.',
        icon: <Building2 className="w-4 h-4" />
    },
    {
        id: 'facebook',
        name: 'Facebook / Instagram',
        rootTag: 'listings',
        email: 'API Directa',
        color: 'bg-blue-600 text-white border-blue-700',
        desc: 'Gestor de Catálogo API. Publica o retira habitaciones individualmente.',
        icon: <Facebook className="w-4 h-4" />
    },
    {
        id: 'trovit',
        name: 'Trovit',
        rootTag: 'trovit',
        email: 'feeds@trovit.com',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        desc: 'El agregador más grande. Formato estándar XML.'
    },
    {
        id: 'mitula',
        name: 'Mitula',
        rootTag: 'mitula',
        email: 'info@mitula.com',
        color: 'bg-green-100 text-green-800 border-green-200',
        desc: 'Gran tráfico orgánico. Acepta variaciones del feed Trovit.'
    },
    {
        id: 'nestoria',
        name: 'Nestoria',
        rootTag: 'nestoria',
        email: 'partners@nestoria.com',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        desc: 'Enfocado en calidad. Requiere imágenes de alta resolución.'
    },
    {
        id: 'nuroa',
        name: 'Nuroa',
        rootTag: 'nuroa',
        email: 'info@nuroa.es',
        color: 'bg-red-100 text-red-800 border-red-200',
        desc: 'Popular en España y Alemania. Sindicación rápida.'
    }
];

// Tipo de acción para Facebook
type FbAction = 'UPDATE' | 'DELETE' | null;

export const FeedGenerator: React.FC = () => {
    const [activePortal, setActivePortal] = useState<PortalConfig>(PORTALS[0]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [xmlContent, setXmlContent] = useState('');
    const [publicUrl, setPublicUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({ rent: 0, sale: 0 });
    const [properties, setProperties] = useState<Property[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    // API CONFIGS
    const [fbCatalogId, setFbCatalogId] = useState('1598170988011366');
    const [fbToken, setFbToken] = useState('EAAQ2bZBIktskBQJ9ZC7yI1HDGuPhp5f6GuJIohsVKPsvV2hUZClf0yHlTrrVXaT3SVDcmKZCBh7oqF39okbuuw6ySTqghmSroj9wSrIQj2gVwKH4GqclIDuupjjh15GPWHtaSIuGZCAfZA4BCXfNjXHQZAnIbMpnimyeenVqIo2Gnuz5j0EnJJYWlox80Mie0KNEU0nA8gxDjQmHDTS83fuqlspTTf1GFhN5Eq9qkTgrompnw6sAZBXOlMfSyqE2QaEZASkS44VPd2VlZBAjVyPkBzcoO8lE097YWhgwKZBN8QZD');
    const [idealistaILC, setIdealistaILC] = useState('ilcc824f125151ec85d2e388813bece4c69b0a71e2f');

    const [showConfig, setShowConfig] = useState(false);
    const [apiLog, setApiLog] = useState<string>('');

    // Facebook Selection State: { [itemId]: 'UPDATE' | 'DELETE' }
    const [fbSelection, setFbSelection] = useState<Record<string, FbAction>>({});
    const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData();
        // Load saved configs
        const savedId = localStorage.getItem('rentia_fb_catalog_id');
        const savedToken = localStorage.getItem('rentia_fb_token');
        const savedILC = localStorage.getItem('rentia_idealista_ilc');

        if (savedId) setFbCatalogId(savedId);
        if (savedToken) setFbToken(savedToken);
        if (savedILC) setIdealistaILC(savedILC);
    }, []);

    const fetchData = async () => {
        const propsSnap = await getDocs(collection(db, "properties"));
        const oppsSnap = await getDocs(collection(db, "opportunities"));

        const props: Property[] = [];
        propsSnap.forEach(doc => props.push({ ...doc.data(), id: doc.id } as Property));

        const opps: Opportunity[] = [];
        oppsSnap.forEach(doc => opps.push({ ...doc.data(), id: doc.id } as Opportunity));

        setProperties(props);
        setOpportunities(opps);
    };

    const saveConfigs = () => {
        localStorage.setItem('rentia_fb_catalog_id', fbCatalogId);
        localStorage.setItem('rentia_fb_token', fbToken);
        localStorage.setItem('rentia_idealista_ilc', idealistaILC);
        setShowConfig(false);
        alert('Configuración guardada.');
    };

    const BASE_URL = 'https://www.rentiaroom.com';

    const logApi = (msg: string) => {
        setApiLog(prev => `> ${msg}\n${prev}`);
    };

    const toggleFbSelection = (id: string, action: FbAction) => {
        setFbSelection(prev => {
            const current = prev[id];
            if (current === action) {
                const newState = { ...prev };
                delete newState[id]; // Deseleccionar si ya estaba seleccionado
                return newState;
            }
            return { ...prev, [id]: action };
        });
    };

    // --- XML GENERATOR LOGIC ---
    const buildXMLString = async (): Promise<string> => {
        await fetchData();
        let countRent = 0;
        let countSale = 0;

        // === GENERADOR IDEALISTA ===
        if (activePortal.id === 'idealista') {
            let xml = `<?xml version="1.0" encoding="UTF-8"?>
<pack>
  <kycode>${idealistaILC}</kycode>
  <clientReference>${idealistaILC}</clientReference>
`;
            // Idealista: Habitaciones (Rent)
            properties.forEach(prop => {
                prop.rooms.forEach(room => {
                    if (room.status === 'available') {
                        countRent++;
                        const desc = `Habitación disponible en ${prop.address}. ${prop.floor || ''}. Ideal para ${room.targetProfile === 'students' ? 'estudiantes' : 'trabajadores'}. ${prop.bathrooms} baños en la vivienda. ${room.hasAirConditioning ? 'Aire Acondicionado.' : ''} ${room.expenses}.`;

                        xml += `  <ad>
    <adId>${room.id}</adId>
    <operation>rent</operation>
    <typology>bedroom</typology>
    <adReference>${room.id}</adReference>
    <adDescription><![CDATA[${desc}]]></adDescription>
    <adAddress>
       <streetName><![CDATA[${prop.address}]]></streetName>
       <streetNumber></streetNumber>
       <postalCode>30001</postalCode> 
       <city><![CDATA[${prop.city}]]></city>
    </adAddress>
    <adPrice>
        <price>${room.price}</price>
        <priceCommunity>0</priceCommunity>
    </adPrice>
    <adFeatures>
        <constructedArea>${prop.rooms.length * 15}</constructedArea> 
        <rooms>${prop.rooms.length}</rooms>
        <bathrooms>${prop.bathrooms || 1}</bathrooms>
        <floor>${prop.floor || '2'}</floor>
        <hasLift>${prop.rooms.length > 2 ? 'true' : 'false'}</hasLift>
        <isFurnished>true</isFurnished>
    </adFeatures>
    <adImages>
`;
                        // Images
                        const images = (room.images && room.images.length > 0) ? room.images : (prop.image ? [prop.image] : []);
                        images.forEach((img, idx) => {
                            xml += `      <image>
        <imageOrder>${idx + 1}</imageOrder>
        <imageLabel>Foto ${idx + 1}</imageLabel>
        <imageUrl><![CDATA[${img}]]></imageUrl>
      </image>\n`;
                        });

                        xml += `    </adImages>
    <adContact>
        <contactName>RentiaRoom</contactName>
        <contactPhone>+34672886369</contactPhone>
        <contactEmail>info@rentiaroom.com</contactEmail>
    </adContact>
  </ad>\n`;
                    }
                });
            });

            // Idealista: Ventas (Oportunidades)
            opportunities.forEach(opp => {
                if (opp.status === 'available') {
                    countSale++;
                    xml += `  <ad>
    <adId>${opp.id}</adId>
    <operation>sale</operation>
    <typology>flat</typology>
    <adReference>${opp.id}</adReference>
    <adDescription><![CDATA[${opp.description}]]></adDescription>
    <adAddress>
       <streetName><![CDATA[${opp.address}]]></streetName>
       <city><![CDATA[${opp.city}]]></city>
    </adAddress>
    <adPrice>
        <price>${opp.financials.purchasePrice}</price>
    </adPrice>
    <adFeatures>
        <constructedArea>${opp.specs.sqm}</constructedArea>
        <rooms>${opp.specs.rooms}</rooms>
        <bathrooms>${opp.specs.bathrooms}</bathrooms>
        <hasLift>${opp.specs.hasElevator ? 'true' : 'false'}</hasLift>
    </adFeatures>
    <adImages>
`;
                    opp.images.forEach((img, idx) => {
                        xml += `      <image>
        <imageOrder>${idx + 1}</imageOrder>
        <imageUrl><![CDATA[${img}]]></imageUrl>
      </image>\n`;
                    });
                    xml += `    </adImages>
  </ad>\n`;
                }
            });

            xml += `</pack>`;
            setStats({ rent: countRent, sale: countSale });
            return xml;
        }

        // === GENERADOR ESTÁNDAR (Trovit/Mitula) ===
        let xml = `<?xml version="1.0" encoding="utf-8"?>\n<${activePortal.rootTag}>\n`;

        properties.forEach(prop => {
            prop.rooms.forEach(room => {
                if (room.status === 'available') {
                    countRent++;
                    const link = `${BASE_URL}/#/habitaciones`;
                    const title = `Habitación en ${prop.address}`;
                    const desc = `Alquiler habitación. ${prop.city}. Precio: ${room.price}`;
                    const img = (room.images && room.images[0]) || prop.image;

                    xml += `  <ad>
    <id><![CDATA[${room.id}]]></id>
    <url><![CDATA[${link}]]></url>
    <title><![CDATA[${title}]]></title>
    <type><![CDATA[For Rent]]></type>
    <content><![CDATA[${desc}]]></content>
    <price><![CDATA[${room.price}]]></price>
    <property_type><![CDATA[Room]]></property_type>
    <address><![CDATA[${prop.address}]]></address>
    <city><![CDATA[${prop.city}]]></city>
    <pictures>
      <picture><picture_url><![CDATA[${img}]]></picture_url></picture>
    </pictures>
  </ad>\n`;
                }
            });
        });

        opportunities.forEach(opp => {
            if (opp.status === 'available') {
                countSale++;
                const link = `${BASE_URL}/#/oportunidades?opp=${opp.id}`;
                const img = opp.images[0];
                xml += `  <ad>
    <id><![CDATA[${opp.id}]]></id>
    <url><![CDATA[${link}]]></url>
    <title><![CDATA[${opp.title}]]></title>
    <type><![CDATA[For Sale]]></type>
    <price><![CDATA[${opp.financials.purchasePrice}]]></price>
    <pictures>
      <picture><picture_url><![CDATA[${img}]]></picture_url></picture>
    </pictures>
  </ad>\n`;
            }
        });

        xml += `</${activePortal.rootTag}>`;
        setStats({ rent: countRent, sale: countSale });
        return xml;
    };

    // --- FACEBOOK BATCH API EXECUTION ---
    const executeBatch = async () => {
        // (Código existente de Facebook se mantiene igual)
        if (!fbCatalogId || !fbToken) {
            alert("Falta configuración API.");
            setShowConfig(true);
            return;
        }
        // ... Rest of logic identical to before ...
        const itemsToProcess = Object.entries(fbSelection);
        if (itemsToProcess.length === 0) {
            alert("Selecciona al menos una habitación para Publicar o Retirar.");
            return;
        }
        setUploading(true);
        setApiLog('Preparando lote de envíos...\n');
        try {
            const requests: any[] = [];
            for (const [id, action] of itemsToProcess) {
                if (action === 'DELETE') {
                    requests.push({ method: "DELETE", retailer_id: id });
                    continue;
                }
                if (action === 'UPDATE') {
                    let found = false;
                    for (const prop of properties) {
                        const room = prop.rooms.find(r => r.id === id);
                        if (room) {
                            found = true;
                            const link = `${BASE_URL}/#/habitaciones`;
                            const mainImage = (room.images && room.images.length > 0) ? room.images[0] : prop.image;
                            requests.push({
                                method: "UPDATE",
                                retailer_id: room.id,
                                data: {
                                    home_listing_id: room.id,
                                    name: `Habitación en ${prop.address}, ${prop.city} (${room.name})`,
                                    availability: "for_rent",
                                    description: `Habitación en alquiler. ${prop.floor || ''}. ${prop.bathrooms} baños. Perfil: ${room.targetProfile}. Precio: ${room.price}€.`,
                                    address: { addr1: prop.address, city: prop.city, region: "Murcia", country: "ES", postal_code: "30001" },
                                    price: room.price,
                                    currency: "EUR",
                                    url: link,
                                    images: [{ url: mainImage }],
                                    num_beds: 1,
                                    num_baths: prop.bathrooms || 1,
                                    property_type: "apartment",
                                    listing_type: "for_rent_by_agent"
                                }
                            });
                            break;
                        }
                    }
                    if (!found) {
                        const opp = opportunities.find(o => o.id === id);
                        if (opp) {
                            const link = `${BASE_URL}/#/oportunidades?opp=${opp.id}`;
                            requests.push({
                                method: "UPDATE",
                                retailer_id: opp.id,
                                data: {
                                    home_listing_id: opp.id,
                                    name: opp.title,
                                    availability: "for_sale",
                                    description: opp.description.substring(0, 5000),
                                    address: { addr1: opp.address, city: opp.city, region: "Murcia", country: "ES" },
                                    price: opp.financials.purchasePrice,
                                    currency: "EUR",
                                    url: link,
                                    images: opp.images.map(img => ({ url: img })),
                                    num_beds: opp.specs.rooms,
                                    num_baths: opp.specs.bathrooms,
                                    property_type: "apartment",
                                    listing_type: "for_sale_by_agent"
                                }
                            });
                        }
                    }
                }
            }
            logApi(`Enviando ${requests.length} operaciones a Facebook Graph API...`);
            const batchUrl = `https://graph.facebook.com/v20.0/${fbCatalogId}/batch`;
            const response = await fetch(batchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: fbToken, requests: requests })
            });
            const json = await response.json();
            if (json.error) { logApi(`ERROR GLOBAL: ${json.error.message}`); }
            else {
                logApi('Respuesta recibida.');
                setFbSelection({});
                if (json.handles) logApi(`✅ Éxito. ${json.handles.length} items procesados.`);
                else logApi(JSON.stringify(json, null, 2));
            }
        } catch (error: any) {
            logApi(`ERROR RED: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handlePreview = async () => {
        setLoading(true);
        setXmlContent('');
        try {
            const xml = await buildXMLString();
            setXmlContent(xml);
        } catch (e) {
            console.error(e);
            alert("Error generando vista previa");
        } finally {
            setLoading(false);
        }
    };

    const handlePublishToCloud = async () => {
        setUploading(true);
        try {
            const xml = await buildXMLString();
            setXmlContent(xml);
            const fileName = `feeds/${activePortal.id}_feed.xml`;
            const storageRef = ref(storage, fileName);
            await uploadString(storageRef, xml, 'raw', { contentType: 'application/xml' });
            const url = await getDownloadURL(storageRef);
            setPublicUrl(url);
            logApi(`XML Publicado: ${url}`);
        } catch (error) {
            console.error("Error publicando feed:", error);
            alert("Error al subir el feed a la nube.");
        } finally {
            setUploading(false);
        }
    };

    const downloadXML = () => {
        const element = document.createElement("a");
        const file = new Blob([xmlContent], { type: 'text/xml' });
        element.href = URL.createObjectURL(file);
        element.download = `${activePortal.id}_feed_${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(element);
        element.click();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpand = (id: string) => {
        setExpandedProps(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Rss className="w-5 h-5 text-rentia-blue" />
                        Gestor de Catálogos
                    </h3>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Sindicación
                    </span>
                </div>

                {/* Portal Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {PORTALS.map(portal => (
                        <button
                            key={portal.id}
                            onClick={() => { setActivePortal(portal); setXmlContent(''); setPublicUrl(null); setApiLog(''); }}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${activePortal.id === portal.id
                                ? `${portal.color} shadow-sm ring-2 ring-offset-1 ring-transparent`
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {portal.icon ? portal.icon : <Layers className="w-4 h-4" />}
                            {portal.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col gap-6 overflow-hidden">

                {/* INSTRUCTIONS PANEL */}
                <div className={`border rounded-lg p-4 text-sm flex-shrink-0 ${activePortal.id === 'facebook' ? 'bg-blue-50 text-blue-900 border-blue-200' : (activePortal.id === 'idealista' ? 'bg-lime-50 text-lime-900 border-lime-200' : 'bg-gray-50 text-gray-700 border-gray-200')}`}>

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2 font-bold">
                                {activePortal.id === 'facebook' && <Zap className="w-4 h-4 text-yellow-600" />}
                                {activePortal.id === 'idealista' && <Building2 className="w-4 h-4 text-lime-600" />}
                                Configuración: {activePortal.name}
                            </div>
                            <p className="text-xs opacity-90 max-w-lg mb-2">
                                {activePortal.desc}
                            </p>
                            {activePortal.id === 'idealista' && (
                                <p className="text-xs font-mono bg-white/50 px-2 py-1 rounded inline-block border border-lime-200">
                                    ILC Code: <strong>{idealistaILC.substring(0, 10)}...</strong>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-100 transition-colors"
                        >
                            <Settings className="w-3 h-3" /> Configuración
                        </button>
                    </div>

                    {/* CONFIG PANEL */}
                    {showConfig && (
                        <div className="bg-white p-4 rounded border border-gray-200 animate-in slide-in-from-top-2 shadow-sm mb-4">
                            <h4 className="font-bold text-xs uppercase text-gray-500 mb-3">Credenciales API</h4>
                            <div className="space-y-3">
                                {activePortal.id === 'facebook' ? (
                                    <>
                                        {/* GUIA DE PERMISOS */}
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-4">
                                            <h5 className="font-bold text-yellow-800 text-xs flex items-center gap-2 mb-1">
                                                <HelpCircle className="w-3 h-3" /> ¿Problemas con el Token?
                                            </h5>
                                            <p className="text-[10px] text-yellow-700 leading-relaxed">
                                                Si no encuentras el permiso <strong>catalog_management</strong>, busca y añade <strong>business_management</strong>.
                                                Es necesario generar un nuevo token con estos permisos en el Graph API Explorer.
                                            </p>
                                            <a
                                                href="https://developers.facebook.com/tools/explorer/"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] font-bold text-blue-600 hover:underline mt-1 block"
                                            >
                                                Ir a Facebook Graph API Explorer →
                                            </a>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Facebook Catalog ID</label>
                                            <input type="text" value={fbCatalogId} onChange={(e) => setFbCatalogId(e.target.value)} className="w-full p-2 border rounded text-xs bg-gray-50 font-mono focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Access Token</label>
                                            <input type="password" value={fbToken} onChange={(e) => setFbToken(e.target.value)} className="w-full p-2 border rounded text-xs bg-gray-50 font-mono focus:border-blue-500 outline-none" />
                                        </div>
                                    </>
                                ) : activePortal.id === 'idealista' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Idealista Link Code (ILC)</label>
                                        <input type="text" value={idealistaILC} onChange={(e) => setIdealistaILC(e.target.value)} className="w-full p-2 border rounded text-xs bg-gray-50 font-mono focus:border-lime-500 outline-none" />
                                        <p className="text-[10px] text-gray-400 mt-1">Este código identifica tu cuenta al importar el XML.</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic">Este portal no requiere configuración adicional de API. Usa la generación XML estándar.</p>
                                )}

                                {(activePortal.id === 'facebook' || activePortal.id === 'idealista') && (
                                    <div className="flex justify-end">
                                        <button onClick={saveConfigs} className="bg-rentia-black text-white px-4 py-2 rounded text-xs font-bold hover:bg-gray-800">Guardar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ACTION LOG OR INSTRUCTIONS */}
                    {apiLog && (
                        <div className="mt-4">
                            <label className="text-xs font-bold opacity-70 mb-1 block">Log de Actividad:</label>
                            <textarea readOnly value={apiLog} className="w-full h-24 bg-slate-900 text-green-400 font-mono text-[10px] p-3 rounded border border-slate-700 resize-none" />
                        </div>
                    )}
                </div>

                {/* --- FACEBOOK ITEM SELECTION TABLE --- */}
                {activePortal.id === 'facebook' && (
                    <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                        {properties.map(prop => (
                            <div key={prop.id} className="bg-white border-b border-gray-100 last:border-0">
                                {/* Property Header */}
                                <div
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(prop.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedProps[prop.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                            <Home className="w-3 h-3 text-rentia-blue" />
                                            {prop.address}
                                        </span>
                                        <span className="text-[10px] text-gray-400">({prop.rooms.length} habs)</span>
                                    </div>
                                </div>

                                {/* Rooms List */}
                                {expandedProps[prop.id] && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-2 space-y-2 pl-8">
                                        {prop.rooms.map(room => {
                                            const action = fbSelection[room.id];
                                            return (
                                                <div key={room.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded w-10 text-center">{room.name}</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium text-gray-700">Habitación {room.price}€</span>
                                                            <span className={`text-[9px] uppercase font-bold ${room.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {room.status === 'available' ? 'Disponible' : 'Alquilada'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Botón PUBLICAR (Verde) */}
                                                        <button
                                                            onClick={() => toggleFbSelection(room.id, 'UPDATE')}
                                                            className={`p-1.5 rounded transition-all border ${action === 'UPDATE'
                                                                ? 'bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300'
                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600'
                                                                }`}
                                                            title="Publicar/Actualizar en Facebook"
                                                        >
                                                            <CloudUpload className="w-4 h-4" />
                                                        </button>

                                                        {/* Botón BORRAR (Rojo) */}
                                                        <button
                                                            onClick={() => toggleFbSelection(room.id, 'DELETE')}
                                                            className={`p-1.5 rounded transition-all border ${action === 'DELETE'
                                                                ? 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-300'
                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-600'
                                                                }`}
                                                            title="Retirar de Facebook"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* --- XML OUTPUT AREA --- */}
                {activePortal.id !== 'facebook' && (
                    <div className="flex flex-col gap-4 flex-grow">
                        {/* Public URL Display */}
                        {publicUrl && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-white rounded-full text-green-600 shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-green-800 uppercase mb-1">Feed Publicado (URL Pública)</p>
                                        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-green-700 truncate block hover:underline font-mono">{publicUrl}</a>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(publicUrl)}
                                    className="ml-4 p-2 bg-white rounded border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                                    title="Copiar URL"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}

                        {/* XML Editor/Viewer */}
                        {xmlContent && (
                            <div className="relative flex-grow min-h-[150px]">
                                <textarea
                                    readOnly
                                    value={xmlContent}
                                    className="w-full h-full p-4 text-xs font-mono bg-slate-900 text-green-400 rounded-lg border border-slate-700 focus:outline-none resize-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(xmlContent)}
                                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-md transition-colors backdrop-blur-sm"
                                    title="Copiar XML"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- FOOTER ACTIONS --- */}
                <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                    {activePortal.id === 'facebook' ? (
                        <button
                            onClick={executeBatch}
                            disabled={uploading}
                            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {uploading ? 'Procesando...' : `Ejecutar Cambios (${Object.keys(fbSelection).length})`}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handlePreview}
                                disabled={loading}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Generar XML
                            </button>

                            {xmlContent && (
                                <>
                                    <button
                                        onClick={handlePublishToCloud}
                                        disabled={uploading}
                                        className="flex-1 bg-rentia-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                                        Publicar en Nube
                                    </button>
                                    <button
                                        onClick={downloadXML}
                                        className="px-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors shadow-sm border border-gray-300"
                                        title="Descargar archivo local"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};
