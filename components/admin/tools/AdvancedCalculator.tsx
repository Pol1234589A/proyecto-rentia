
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calculator, Plus, Trash2, Printer, 
    Settings, ToggleLeft, ToggleRight, 
    ChevronDown, User, FileText, Download,
    Briefcase, Save, CheckCircle, Loader2, Building2, Info, Scale
} from 'lucide-react';
import { Property } from '../../../data/rooms';
import { UserProfile } from '../../../types';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// --- TIPOS ---

interface TenantInput {
    id: string;
    roomName: string;
    tenantName: string;
    baseRent: number;      // Renta Base (Sujeta a comisión)
    supplies: number;      // Suministros (No sujetos a comisión)
    hasCleaning: boolean;  // Toggle
    cleaningAmount: number;// Limpieza (No sujeta a comisión)
}

interface Adjustment {
    id: string;
    concept: string;
    amount: number;
    type: 'suplido' | 'descuento' | 'derrama'; 
}

interface AdvancedCalculatorProps {
    properties?: Property[];
}

export const AdvancedCalculator: React.FC<AdvancedCalculatorProps> = ({ properties = [] }) => {
    
    // --- ESTADO ---

    // Configuración Global
    const [config, setConfig] = useState({
        invoiceNumber: `F-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        commissionPercent: 10,
        vatPercent: 21,
        selectedOwnerId: '', // ID de usuario en Firebase para guardar la factura
    });

    // Datos Fiscales (Manuales por defecto, rellenables)
    const [agencyData, setAgencyData] = useState({
        name: 'RENTIA INVESTMENTS, S.L.',
        cif: 'B-75995308',
        address: 'Calle Brazal de Álamos, 7, 30130 Beniel (Murcia)',
        registry: 'Sociedad inscrita en el Registro Mercantil de Murcia. Constituida en escritura otorgada el 27/02/2025 ante el Notario de Murcia D. José Javier Escolano Navarro, protocolo 757.' 
    });

    const [clientData, setClientData] = useState({
        name: '',
        nif: '',
        address: '',
        propertyAddress: '',
        iban: '' // Nuevo campo para cuenta destino
    });

    // Lista de propietarios para el selector
    const [owners, setOwners] = useState<UserProfile[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Inquilinos (Ingresos)
    const [tenants, setTenants] = useState<TenantInput[]>([
        { id: '1', roomName: 'H1', tenantName: '', baseRent: 0, supplies: 0, hasCleaning: false, cleaningAmount: 0 },
        { id: '2', roomName: 'H2', tenantName: '', baseRent: 0, supplies: 0, hasCleaning: false, cleaningAmount: 0 },
        { id: '3', roomName: 'H3', tenantName: '', baseRent: 0, supplies: 0, hasCleaning: false, cleaningAmount: 0 },
    ]);

    // Ajustes (Gastos/Extras)
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

    useEffect(() => {
        const fetchOwners = async () => {
            const q = query(collection(db, "users"), where("role", "==", "owner"));
            const snap = await getDocs(q);
            const list: UserProfile[] = [];
            snap.forEach(doc => list.push({ ...doc.data(), id: doc.id } as UserProfile));
            setOwners(list);
        };
        fetchOwners();
    }, []);

    // --- CÁLCULOS MATEMÁTICOS (CORE) ---

    const totals = useMemo(() => {
        // 1. INGRESOS (CAJA)
        const totalBaseRent = tenants.reduce((acc, t) => acc + t.baseRent, 0);
        const totalSupplies = tenants.reduce((acc, t) => acc + t.supplies, 0);
        const totalCleaning = tenants.reduce((acc, t) => acc + (t.hasCleaning ? t.cleaningAmount : 0), 0);
        
        const totalCashIn = totalBaseRent + totalSupplies + totalCleaning;

        // 2. HONORARIOS AGENCIA (Solo sobre Renta Base)
        const feeBase = totalBaseRent;
        const feeNet = feeBase * (config.commissionPercent / 100);
        const feeVAT = feeNet * (config.vatPercent / 100);
        const totalAgencyFee = feeNet + feeVAT;

        // 3. AJUSTES (Suplidos y Descuentos)
        const totalSuplidos = adjustments
            .filter(a => a.type === 'suplido' || a.type === 'derrama')
            .reduce((acc, a) => acc + a.amount, 0);

        const totalDiscounts = adjustments
            .filter(a => a.type === 'descuento')
            .reduce((acc, a) => acc + a.amount, 0);

        // 4. LIQUIDACIÓN FINAL
        // Fórmula: Caja - Honorarios - Suplidos + Descuentos
        const netToOwner = totalCashIn - totalAgencyFee - totalSuplidos + totalDiscounts;

        return {
            totalBaseRent,
            totalSupplies,
            totalCleaning,
            totalCashIn,
            feeBase,
            feeNet,
            feeVAT,
            totalAgencyFee,
            totalSuplidos,
            totalDiscounts,
            netToOwner
        };
    }, [tenants, config, adjustments]);

    // --- HANDLERS ---

    const handleLoadProperty = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const propId = e.target.value;
        const prop = properties.find(p => p.id === propId);
        if (!prop) return;

        // Intentar autocompletar datos del cliente si el ownerId coincide
        const owner = owners.find(o => o.id === prop.ownerId);

        setConfig(prev => ({
            ...prev,
            commissionPercent: prop.managementCommission || 10,
            selectedOwnerId: prop.ownerId || ''
        }));

        setClientData(prev => ({
            ...prev,
            name: owner?.name || '',
            nif: owner?.dni || '',
            address: owner?.address || '',
            propertyAddress: prop.address + ', ' + prop.city,
            iban: owner?.bankAccount || ''
        }));

        // --- LÓGICA DE CONTRATOS ---
        // Consultar contratos activos para obtener nombres reales
        let activeTenantsMap: Record<string, string> = {};
        try {
            const qContracts = query(collection(db, "contracts"), where("propertyId", "==", propId), where("status", "==", "active"));
            const snap = await getDocs(qContracts);
            snap.forEach(doc => {
                const d = doc.data();
                // Mapear ID de habitación -> Nombre Inquilino
                if (d.roomId && d.tenantName) {
                    activeTenantsMap[d.roomId] = d.tenantName;
                }
            });
        } catch (error) {
            console.error("Error sincronizando contratos:", error);
        }

        const newTenants = prop.rooms.map(r => ({
            id: r.id,
            roomName: r.name,
            // Usar nombre del contrato si existe, sino el estado
            tenantName: activeTenantsMap[r.id] || (r.status === 'occupied' ? 'Ocupado' : 'Vacío'),
            baseRent: r.price,
            supplies: prop.suppliesConfig?.type === 'fixed' ? (prop.suppliesConfig.fixedAmount || 0) : 0,
            hasCleaning: false,
            cleaningAmount: 0
        }));
        setTenants(newTenants);
    };

    const handleSelectOwner = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ownerId = e.target.value;
        const owner = owners.find(o => o.id === ownerId);
        
        setConfig(prev => ({ ...prev, selectedOwnerId: ownerId }));
        
        if (owner) {
            setClientData(prev => ({
                ...prev,
                name: owner.name || '',
                nif: owner.dni || '',
                address: owner.address || '',
                iban: owner.bankAccount || ''
            }));
        }
    };

    const handleSaveInvoice = async () => {
        if (!config.selectedOwnerId) return alert("Debes seleccionar un propietario vinculado (o cargar la propiedad) para guardar.");
        if (!clientData.name) return alert("El nombre del cliente es obligatorio.");

        setIsSaving(true);
        try {
            const invoicePayload = {
                invoiceNumber: config.invoiceNumber,
                date: config.invoiceDate,
                ownerId: config.selectedOwnerId,
                ownerName: clientData.name,
                propertyAddress: clientData.propertyAddress,
                totalAmount: totals.netToOwner, // Lo que se transfiere
                agencyFee: totals.totalAgencyFee, // Lo que factura la agencia
                ivaAmount: totals.feeVAT,
                details: {
                    month: config.month,
                    tenants,
                    adjustments,
                    totals,
                    agencyData,
                    clientData
                },
                status: 'issued',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "agency_invoices"), invoicePayload);
            alert("Liquidación y Factura guardadas correctamente.");
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Error al guardar la factura.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateTenant = (id: string, field: keyof TenantInput, value: any) => {
        setTenants(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const addTenantRow = () => {
        setTenants([...tenants, { 
            id: Date.now().toString(), 
            roomName: `H${tenants.length + 1}`, 
            tenantName: '', 
            baseRent: 0, 
            supplies: 0, 
            hasCleaning: false, 
            cleaningAmount: 0 
        }]);
    };

    const removeTenantRow = (id: string) => setTenants(prev => prev.filter(t => t.id !== id));

    const addAdjustment = (type: Adjustment['type']) => {
        setAdjustments([...adjustments, {
            id: Date.now().toString(),
            concept: '',
            amount: 0,
            type
        }]);
    };

    const updateAdjustment = (id: string, field: keyof Adjustment, value: any) => {
        setAdjustments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const removeAdjustment = (id: string) => setAdjustments(prev => prev.filter(a => a.id !== id));

    const handlePrint = () => window.print();

    // --- RENDER ---

    return (
        <div className="flex flex-col h-full bg-gray-100 font-sans">
            
            {/* TOOLBAR (No se imprime) */}
            <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print shrink-0 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rentia-black to-gray-800 rounded-lg text-white shadow-md">
                        <Scale className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">Facturación & Liquidación</h2>
                        <p className="text-xs text-gray-500">Modelo Oficial</p>
                    </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto items-center flex-wrap">
                    <div className="relative">
                        <select onChange={handleLoadProperty} className="bg-gray-50 border border-gray-200 text-sm rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-rentia-blue outline-none cursor-pointer hover:bg-white transition-colors">
                            <option value="">Cargar Propiedad...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none"/>
                    </div>

                    <div className="relative">
                        <select 
                            value={config.selectedOwnerId} 
                            onChange={handleSelectOwner}
                            className="bg-gray-50 border border-gray-200 text-sm rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-rentia-blue outline-none cursor-pointer hover:bg-white transition-colors"
                        >
                            <option value="">Vincular Propietario...</option>
                            {owners.map(o => <option key={o.id} value={o.id!}>{o.name}</option>)}
                        </select>
                        <User className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none"/>
                    </div>
                    
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-bold">
                        <Printer className="w-4 h-4" /> Imprimir PDF
                    </button>

                    <button onClick={handleSaveInvoice} disabled={isSaving} className="flex items-center gap-2 bg-rentia-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm font-bold disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Guardar y Enviar
                    </button>
                </div>
            </div>

            {/* DOCUMENTO (Visual de Factura) */}
            <div className="flex-grow overflow-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-[210mm] mx-auto bg-white shadow-2xl border border-gray-200 min-h-[297mm] print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 relative">
                    
                    {/* 1. CABECERA FACTURA */}
                    <div className="p-12 pb-6 border-b border-gray-100 flex justify-between items-start">
                        {/* EMISOR (Agencia) */}
                        <div className="w-1/2">
                            <img src="https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/IMAGENES%20DE%20EMPRESA%2FLOGOS%2FPNG%2FLogo.png?alt=media&token=3d8358f0-2acc-4b82-824f-9e0a3c940240" alt="RentiaRoom" className="h-12 mb-4" />
                            <div className="text-sm text-gray-600 space-y-1">
                                <input className="font-bold text-gray-900 border-none bg-transparent w-full focus:bg-gray-50" value={agencyData.name} onChange={e => setAgencyData({...agencyData, name: e.target.value})} />
                                <div className="flex gap-2 items-center"><span className="font-bold text-xs w-16">NIF:</span> <input className="border-none bg-transparent w-full focus:bg-gray-50" value={agencyData.cif} onChange={e => setAgencyData({...agencyData, cif: e.target.value})} /></div>
                                <div className="flex gap-2 items-center"><span className="font-bold text-xs w-16">Dirección:</span> <input className="border-none bg-transparent w-full focus:bg-gray-50" value={agencyData.address} onChange={e => setAgencyData({...agencyData, address: e.target.value})} /></div>
                            </div>
                        </div>

                        {/* DATOS FACTURA */}
                        <div className="w-1/3 text-right">
                            <h1 className="text-2xl font-bold text-gray-900 font-display uppercase tracking-widest mb-1">LIQUIDACIÓN</h1>
                            <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-4">Y FACTURA DE HONORARIOS</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Nº Factura</span>
                                    <input type="text" className="text-right font-mono font-bold bg-transparent outline-none w-24" value={config.invoiceNumber} onChange={e => setConfig({...config, invoiceNumber: e.target.value})} />
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Fecha</span>
                                    <input type="date" className="text-right font-mono font-bold bg-transparent outline-none" value={config.invoiceDate} onChange={e => setConfig({...config, invoiceDate: e.target.value})} />
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Periodo</span>
                                    <input type="month" className="text-right font-mono font-bold bg-transparent outline-none" value={config.month} onChange={e => setConfig({...config, month: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. RECEPTOR (Cliente) */}
                    <div className="px-12 py-6 bg-gray-50/30 flex justify-between">
                        <div className="w-1/2">
                            <h3 className="text-xs font-bold text-rentia-blue uppercase tracking-wider mb-2">Receptor (Cliente):</h3>
                            <div className="space-y-1">
                                <input placeholder="Nombre / Razón Social" className="block w-full font-bold text-lg bg-transparent border-b border-dashed border-gray-300 focus:border-rentia-blue outline-none py-1" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
                                <div className="flex gap-2"><span className="text-xs font-bold w-16 pt-1">NIF/DNI:</span> <input placeholder="DNI..." className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-rentia-blue outline-none text-sm" value={clientData.nif} onChange={e => setClientData({...clientData, nif: e.target.value})} /></div>
                                <div className="flex gap-2"><span className="text-xs font-bold w-16 pt-1">Dirección:</span> <input placeholder="Dirección fiscal..." className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-rentia-blue outline-none text-sm" value={clientData.address} onChange={e => setClientData({...clientData, address: e.target.value})} /></div>
                                {/* IBAN FIELD: Visibility Fix applied (removed /30 opacity) */}
                                <div className="flex gap-2 items-center bg-yellow-50 p-1 rounded mt-1 border border-yellow-100"><span className="text-xs font-bold w-24 text-rentia-blue">Cuenta Abono:</span> <input placeholder="ES00 0000 0000 0000 0000 0000 0000" className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-rentia-blue outline-none text-sm font-mono" value={clientData.iban} onChange={e => setClientData({...clientData, iban: e.target.value})} /></div>
                            </div>
                        </div>
                        <div className="w-1/3">
                            <h3 className="text-xs font-bold text-rentia-blue uppercase tracking-wider mb-2">Propiedad Gestionada:</h3>
                            <textarea placeholder="Dirección del inmueble..." className="w-full bg-transparent border border-gray-200 rounded p-2 text-sm h-20 resize-none focus:border-rentia-blue outline-none" value={clientData.propertyAddress} onChange={e => setClientData({...clientData, propertyAddress: e.target.value})} />
                        </div>
                    </div>

                    {/* 3. CUERPO DE LA LIQUIDACIÓN - Added significant padding bottom to avoid overlap */}
                    <div className="px-12 py-8 pb-64"> 
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-200 pb-2 mb-6">Detalle de Gestión y Liquidación</h3>

                        {/* DISCLAIMER LEGAL IMPORTANTE ACTUALIZADO */}
                        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800 flex gap-2 items-start text-justify">
                            <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>MANDATO DE GESTIÓN:</strong> Conforme al Art. 79.Dos.3º de la Ley del IVA (LIVA), los importes detallados en "Ingresos por Alquileres" son recibidos por cuenta y orden del propietario, teniendo la consideración de <strong>suplidos</strong> a efectos fiscales. Estos fondos no constituyen ingreso para la agencia y son transferidos íntegramente al titular. 
                                La única operación sujeta a IVA por parte de Rentia Investments S.L. es la detallada en el apartado "Factura por Honorarios de Gestión".
                            </p>
                        </div>

                        {/* Tabla Ingresos */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">1. Cobros por Cuenta del Cliente (Suplidos)</h4>
                                <button onClick={addTenantRow} className="no-print text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"><Plus className="w-3 h-3"/> Añadir Hab</button>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-xs text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="p-2 text-left">Habitación</th>
                                        <th className="p-2 text-left">Inquilino</th>
                                        <th className="p-2 text-right">Renta</th>
                                        <th className="p-2 text-right">Suministros</th>
                                        <th className="p-2 text-right">Limpieza</th>
                                        <th className="p-2 text-right">Total</th>
                                        <th className="no-print w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tenants.map(t => (
                                        <tr key={t.id}>
                                            <td className="p-2"><input value={t.roomName} onChange={e => updateTenant(t.id, 'roomName', e.target.value)} className="w-full bg-transparent font-bold" /></td>
                                            <td className="p-2"><input value={t.tenantName} onChange={e => updateTenant(t.id, 'tenantName', e.target.value)} className="w-full bg-transparent" placeholder="-" /></td>
                                            <td className="p-2 text-right"><input type="number" value={t.baseRent} onChange={e => updateTenant(t.id, 'baseRent', Number(e.target.value))} className="w-20 text-right bg-transparent outline-none" />€</td>
                                            <td className="p-2 text-right"><input type="number" value={t.supplies} onChange={e => updateTenant(t.id, 'supplies', Number(e.target.value))} className="w-20 text-right bg-transparent outline-none" />€</td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-end gap-1 items-center">
                                                    <button onClick={() => updateTenant(t.id, 'hasCleaning', !t.hasCleaning)} className={`no-print ${t.hasCleaning?'text-green-500':'text-gray-300'}`}><ToggleRight className="w-4 h-4"/></button>
                                                    {t.hasCleaning ? <input type="number" value={t.cleaningAmount} onChange={e => updateTenant(t.id, 'cleaningAmount', Number(e.target.value))} className="w-12 text-right bg-transparent border-b border-gray-200 text-xs"/> : '-'}
                                                </div>
                                            </td>
                                            <td className="p-2 text-right font-bold">{(t.baseRent + t.supplies + (t.hasCleaning ? t.cleaningAmount : 0)).toLocaleString()}€</td>
                                            <td className="no-print text-center"><button onClick={() => removeTenantRow(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-gray-300 font-bold bg-gray-50">
                                    <tr>
                                        <td colSpan={5} className="p-2 text-right text-xs uppercase">Total Recaudado (Fondo Cliente)</td>
                                        <td className="p-2 text-right">{totals.totalCashIn.toLocaleString()} €</td>
                                        <td className="no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Desglose Factura Agencia (Honorarios) - FIXED PADDING */}
                        <div className="mb-8 px-4 pb-4 pt-8 bg-white border-2 border-rentia-blue rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-rentia-blue text-white text-[9px] px-2 py-1 uppercase font-bold rounded-bl">Factura Oficial Honorarios</div>
                            <h4 className="text-xs font-bold text-rentia-blue uppercase mb-3 border-b border-blue-100 pb-1 flex justify-between items-center">
                                <span>2. Factura por Honorarios de Gestión</span>
                                <span className="text-[10px] text-gray-500 font-normal">Factura Nº {config.invoiceNumber}</span>
                            </h4>
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span>Base Imponible (Sobre Renta Base de {totals.totalBaseRent}€)</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">% Comisión:</span>
                                    <input type="number" value={config.commissionPercent} onChange={e => setConfig({...config, commissionPercent: Number(e.target.value)})} className="w-10 text-center border rounded bg-white font-bold" />
                                    <span className="font-mono">{totals.feeBase.toFixed(2)} €</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span>IVA ({config.vatPercent}%)</span>
                                <span className="font-mono">{totals.feeVAT.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center text-base font-bold text-blue-900 border-t border-blue-100 pt-2 mt-2">
                                <span>TOTAL FACTURA (A DEDUCIR)</span>
                                <span>-{totals.totalAgencyFee.toFixed(2)} €</span>
                            </div>
                        </div>

                        {/* Ajustes y Suplidos */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">3. Otros Pagos y Ajustes</h4>
                                <div className="flex gap-2 no-print">
                                    <button onClick={() => addAdjustment('suplido')} className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 font-bold border border-red-200">+ Gasto/Suplido (Resta)</button>
                                    <button onClick={() => addAdjustment('descuento')} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 font-bold border border-green-200">+ Abono (Suma)</button>
                                </div>
                            </div>
                            {adjustments.length > 0 ? (
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-100">
                                        {adjustments.map(adj => (
                                            <tr key={adj.id}>
                                                <td className="p-2 w-24">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${adj.type === 'descuento' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{adj.type}</span>
                                                </td>
                                                <td className="p-2"><input value={adj.concept} onChange={e => updateAdjustment(adj.id, 'concept', e.target.value)} className="w-full bg-transparent" placeholder="Concepto..." /></td>
                                                <td className="p-2 text-right w-32"><input type="number" value={adj.amount} onChange={e => updateAdjustment(adj.id, 'amount', Number(e.target.value))} className={`w-full text-right bg-transparent font-bold ${adj.type === 'descuento' ? 'text-green-600' : 'text-red-600'}`} />€</td>
                                                <td className="p-2 w-8 text-center no-print"><button onClick={() => removeAdjustment(adj.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin ajustes adicionales.</p>
                            )}
                        </div>
                    </div>

                    {/* 4. TOTAL Y PIE (Compacto y Seguro) */}
                    <div className="bg-gray-900 text-white px-6 py-4 absolute bottom-0 w-full print:relative">
                        <div className="flex justify-between items-end mb-3">
                            <div className="text-xs text-gray-400 space-y-0.5 w-1/2">
                                <p className="font-bold text-white uppercase text-[10px]">Resultado Liquidación</p>
                                <p className="text-[9px]">Compensación de saldos y transferencia del remanente.</p>
                                <p className="text-[9px]">El importe se transferirá a la cuenta indicada.</p>
                            </div>
                            <div className="text-right leading-none">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">A TRANSFERIR</p>
                                <p className="text-3xl font-bold font-mono">{totals.netToOwner.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                            </div>
                        </div>
                        
                        {/* FOOTER LEGAL COMPACTO */}
                        <div className="border-t border-gray-700 pt-2 text-[8px] text-gray-500 text-justify leading-tight">
                            <p className="mb-1"><strong>PROTECCIÓN DE DATOS:</strong> Responsable: Rentia Investments S.L. | Finalidad: Gestión de la relación contractual inmobiliaria, administrativa, contable y fiscal. | Legitimación: Ejecución de contrato y cumplimiento legal. | Destinatarios: No se cederán datos a terceros, salvo obligación legal. | Derechos: Acceder, rectificar y suprimir los datos, así como otros derechos, ante info@rentiaroom.com.</p>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-1 text-gray-400 border-t border-gray-800 mt-1 pt-1">
                                <span>{agencyData.name} · NIF: {agencyData.cif} · {agencyData.address}</span>
                                <span className="text-right max-w-lg">{agencyData.registry}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
