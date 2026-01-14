
import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Property, BillingRecord, PaymentFlow } from '../../data/rooms';
import {
    CreditCard,
    Calendar,
    Percent,
    ArrowRightLeft,
    AlertCircle,
    Plus,
    Save,
    History,
    Trash2,
    Building,
    CreditCard as CardIcon,
    Landmark,
    User,
    Droplets,
    MessageSquare,
    Users,
    ExternalLink,
    DoorOpen
} from 'lucide-react';

interface PropertyBillingPanelProps {
    properties: Property[];
}

export const PropertyBillingPanel: React.FC<PropertyBillingPanelProps> = ({ properties }) => {
    const [selectedPropId, setSelectedPropId] = useState<string | null>(properties[0]?.id || null);
    const selectedProperty = properties.find(p => p.id === selectedPropId);

    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [tempConfig, setTempConfig] = useState<{
        transferDay?: number;
        managementCommission?: number;
        paymentFlow?: PaymentFlow;
        bankAccount?: string;
        bankAccountHolder?: string;
        suppliesConfig?: {
            type: 'fixed' | 'shared';
            fixedAmount?: number;
            roomOverrides?: Record<string, number>;
        };
        receiptDest?: 'private' | 'group';
        receiptLink?: string;
        totalRooms?: number;
    }>({});

    const handleEditConfig = () => {
        if (selectedProperty) {
            setTempConfig({
                transferDay: selectedProperty.transferDay || 1,
                managementCommission: selectedProperty.managementCommission || 13,
                paymentFlow: selectedProperty.paymentFlow || 'tenant_rentia_owner',
                bankAccount: selectedProperty.bankAccount || '',
                bankAccountHolder: selectedProperty.bankAccountHolder || '',
                suppliesConfig: selectedProperty.suppliesConfig || { type: 'shared', fixedAmount: 0, roomOverrides: {} },
                receiptDest: selectedProperty.receiptDest || 'private',
                receiptLink: selectedProperty.receiptLink || '',
                totalRooms: selectedProperty.totalRooms || selectedProperty.rooms.length
            });
            setIsEditingConfig(true);
        }
    };

    const handleSaveConfig = async () => {
        if (selectedProperty && selectedPropId) {
            try {
                await updateDoc(doc(db, "properties", selectedPropId), {
                    transferDay: tempConfig.transferDay,
                    managementCommission: tempConfig.managementCommission,
                    paymentFlow: tempConfig.paymentFlow,
                    bankAccount: tempConfig.bankAccount,
                    bankAccountHolder: tempConfig.bankAccountHolder,
                    suppliesConfig: tempConfig.suppliesConfig,
                    receiptDest: tempConfig.receiptDest,
                    receiptLink: tempConfig.receiptLink,
                    totalRooms: tempConfig.totalRooms
                });
                setIsEditingConfig(false);
            } catch (error) {
                console.error("Error updating config:", error);
                alert("Error al guardar la configuración");
            }
        }
    };

    const handleAddRecord = async () => {
        if (selectedProperty && selectedPropId) {
            const now = new Date();
            const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const newRecord: BillingRecord = {
                month: monthStr,
                invoiceNumber: '',
                status: 'pending',
                ownerAmount: 0,
                rentiaAmount: 0,
                notes: ''
            };

            const newHistory = [newRecord, ...(selectedProperty.billingHistory || [])];

            try {
                await updateDoc(doc(db, "properties", selectedPropId), {
                    billingHistory: newHistory
                });
            } catch (error) {
                console.error("Error adding record:", error);
            }
        }
    };

    const handleUpdateRecord = async (index: number, updates: Partial<BillingRecord>) => {
        if (selectedProperty && selectedPropId && selectedProperty.billingHistory) {
            const newHistory = [...selectedProperty.billingHistory];
            newHistory[index] = { ...newHistory[index], ...updates };

            try {
                await updateDoc(doc(db, "properties", selectedPropId), {
                    billingHistory: newHistory
                });
            } catch (error) {
                console.error("Error updating record:", error);
            }
        }
    };

    const handleDeleteRecord = async (index: number) => {
        if (selectedProperty && selectedPropId && selectedProperty.billingHistory) {
            if (!confirm("¿Estás seguro de eliminar este registro?")) return;

            const newHistory = selectedProperty.billingHistory.filter((_, i) => i !== index);

            try {
                await updateDoc(doc(db, "properties", selectedPropId), {
                    billingHistory: newHistory
                });
            } catch (error) {
                console.error("Error deleting record:", error);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getFlowLabel = (flow?: PaymentFlow) => {
        if (flow === 'tenant_rentia_owner') return 'Inquilino → Rentia → Propietario';
        if (flow === 'tenant_owner_rentia') return 'Inquilino → Propietario → Rentia';
        return 'No definido';
    };

    const getBillingStatus = () => {
        if (!selectedProperty) return null;
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const record = selectedProperty.billingHistory?.find(r => r.month === currentMonthStr);

        const day = now.getDate();
        const limit = selectedProperty.transferDay || 10;

        if (record?.status === 'paid') return { type: 'paid', message: 'Liquidación completada este mes.' };
        if (record?.status === 'sent') return { type: 'process', message: 'Liquidación en proceso: factura enviada, pendiente de completar pago/cobro.' };
        if (day > limit) return { type: 'overdue', message: `¡ATENCIÓN! Se ha superado el día límite (${limit}) para el pago.` };
        if (day >= limit - 2) return { type: 'near', message: `Recordatorio: El día límite de pago (${limit}) se aproxima.` };
        return { type: 'ok', message: `Pendiente de liquidación. Fecha límite: día ${limit}.` };
    };

    const billingStatus = getBillingStatus();

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-indigo-500" />
                    Información sobre Facturación y Pagos
                </h2>
                <p className="text-sm text-gray-500 mt-1">Configura las condiciones de cobro para cada propiedad y lleva el seguimiento de transferencias.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Property Selection */}
                <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                    {properties.map(prop => (
                        <button
                            key={prop.id}
                            onClick={() => setSelectedPropId(prop.id)}
                            className={`w-full text-left p-4 rounded-xl transition-all border ${selectedPropId === prop.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                }`}
                        >
                            <div className="font-bold truncate text-sm flex items-center justify-between gap-1">
                                <span>{prop.address}</span>
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0" title={`Total habitaciones: ${prop.totalRooms || prop.rooms.length}`}>
                                    <DoorOpen size={10} /> {prop.totalRooms || prop.rooms.length}
                                </span>
                            </div>
                            <div className={`text-[10px] mt-1 flex items-center justify-between ${selectedPropId === prop.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Día {prop.transferDay || '-'}
                                </div>
                                {(() => {
                                    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                                    const record = prop.billingHistory?.find(r => r.month === currentMonthStr);
                                    if (record?.status === 'paid') {
                                        return <div className="w-2 h-2 rounded-full bg-emerald-400" title="Pagado" />;
                                    } else if (record?.status === 'sent') {
                                        return <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="En proceso" />;
                                    } else if (new Date().getDate() > (prop.transferDay || 10)) {
                                        return <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Retrasado" />;
                                    }
                                    return null;
                                })()}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Property Details */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedProperty ? (
                        <>
                            {/* Configuration Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-gray-400" />
                                        <h3 className="font-bold text-gray-800">{selectedProperty.address}</h3>
                                    </div>
                                    {!isEditingConfig ? (
                                        <button
                                            onClick={handleEditConfig}
                                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                                        >
                                            Editar Condiciones
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveConfig}
                                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                                        >
                                            <Save size={14} />
                                            Guardar Cambios
                                        </button>
                                    )
                                    }
                                </div>

                                <div className="p-6">
                                    {isEditingConfig ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Día de Pago (al mes)</label>
                                                <input
                                                    type="number" min="1" max="31"
                                                    aria-label="Día de pago al mes"
                                                    title="Día de pago al mes"
                                                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={tempConfig.transferDay}
                                                    onChange={e => setTempConfig({ ...tempConfig, transferDay: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comisión (%)</label>
                                                <input
                                                    type="number" step="0.1"
                                                    aria-label="Porcentaje de comisión"
                                                    title="Porcentaje de comisión"
                                                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={tempConfig.managementCommission}
                                                    onChange={e => setTempConfig({ ...tempConfig, managementCommission: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flujo de Fondos</label>
                                                <select
                                                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    aria-label="Flujo de fondos"
                                                    title="Flujo de fondos"
                                                    value={tempConfig.paymentFlow}
                                                    onChange={e => setTempConfig({ ...tempConfig, paymentFlow: e.target.value as PaymentFlow })}
                                                >
                                                    <option value="tenant_rentia_owner">Inquilino → Rentia → Propietario</option>
                                                    <option value="tenant_owner_rentia">Inquilino → Propietario → Rentia</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nº Habitaciones Total</label>
                                                <input
                                                    type="number" min="1"
                                                    aria-label="Número total de habitaciones"
                                                    title="Número total de habitaciones"
                                                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={tempConfig.totalRooms}
                                                    onChange={e => setTempConfig({ ...tempConfig, totalRooms: parseInt(e.target.value) })}
                                                />
                                            </div>

                                            <div className="md:col-span-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6">
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Droplets className="w-3 h-3" /> Configuración Suministros
                                                    </label>
                                                    <div className="flex bg-white rounded-lg p-1 border">
                                                        <button
                                                            onClick={() => setTempConfig({ ...tempConfig, suppliesConfig: { ...tempConfig.suppliesConfig!, type: 'shared' } })}
                                                            className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold transition-all ${tempConfig.suppliesConfig?.type === 'shared' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            GASTOS A REPARTIR
                                                        </button>
                                                        <button
                                                            onClick={() => setTempConfig({ ...tempConfig, suppliesConfig: { ...tempConfig.suppliesConfig!, type: 'fixed' } })}
                                                            className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold transition-all ${tempConfig.suppliesConfig?.type === 'fixed' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            CUOTA FIJA (€)
                                                        </button>
                                                    </div>
                                                </div>
                                                {tempConfig.suppliesConfig?.type === 'fixed' && (
                                                    <div className="flex-1 flex flex-col md:flex-row gap-4">
                                                        <div className="w-full md:w-32 space-y-1.5">
                                                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Importe Fijo</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-6 font-bold text-blue-700"
                                                                    value={tempConfig.suppliesConfig.fixedAmount}
                                                                    onChange={e => setTempConfig({ ...tempConfig, suppliesConfig: { ...tempConfig.suppliesConfig!, fixedAmount: parseFloat(e.target.value) } })}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-300">€</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow pt-1">
                                                            <div className="bg-white/50 border border-blue-100/50 rounded-lg p-3">
                                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-2">Ajustes por Habitación (Cuotas Especiales):</p>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                    {selectedProperty.rooms.map((room) => (
                                                                        <div key={room.id} className="flex items-center gap-2 bg-white p-1.5 rounded border border-blue-50">
                                                                            <span className="text-[10px] font-bold text-gray-600 min-w-[30px]">{room.name}</span>
                                                                            <div className="relative flex-grow">
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder={tempConfig.suppliesConfig?.fixedAmount?.toString()}
                                                                                    className="w-full pl-1 pr-4 py-1 bg-gray-50 border-0 border-b border-gray-100 text-[10px] focus:ring-0 focus:border-blue-400 outline-none text-right font-bold text-blue-600"
                                                                                    value={tempConfig.suppliesConfig?.roomOverrides?.[room.id] || ''}
                                                                                    onChange={e => {
                                                                                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                                                        const newOverrides = { ...tempConfig.suppliesConfig?.roomOverrides };
                                                                                        if (val === undefined) {
                                                                                            delete newOverrides[room.id];
                                                                                        } else {
                                                                                            newOverrides[room.id] = val;
                                                                                        }
                                                                                        setTempConfig({
                                                                                            ...tempConfig,
                                                                                            suppliesConfig: { ...tempConfig.suppliesConfig!, roomOverrides: newOverrides }
                                                                                        });
                                                                                    }}
                                                                                />
                                                                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-bold text-blue-300">€</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[9px] text-blue-400 mt-2 italic leading-tight">
                                                                    * Deja vacío para usar la cuota base de {tempConfig.suppliesConfig?.fixedAmount || 0}€
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titular de la Cuenta</label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            aria-label="Titular de la cuenta"
                                                            title="Titular de la cuenta"
                                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            value={tempConfig.bankAccountHolder}
                                                            onChange={e => setTempConfig({ ...tempConfig, bankAccountHolder: e.target.value })}
                                                            placeholder="Nombre completo del titular"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuenta Bancaria (IBAN)</label>
                                                    <div className="relative">
                                                        <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            aria-label="Cuenta bancaria"
                                                            title="Cuenta bancaria"
                                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                                            value={tempConfig.bankAccount}
                                                            onChange={e => setTempConfig({ ...tempConfig, bankAccount: e.target.value })}
                                                            placeholder="ES00 0000 0000 0000 0000 0000"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" /> Destino de Justificantes
                                                        </label>
                                                        <div className="flex bg-white rounded-lg p-1 border">
                                                            <button
                                                                onClick={() => setTempConfig({ ...tempConfig, receiptDest: 'private' })}
                                                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${tempConfig.receiptDest === 'private' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                            >
                                                                <User className="w-3 h-3" /> PROPIETARIO (PRIVADO)
                                                            </button>
                                                            <button
                                                                onClick={() => setTempConfig({ ...tempConfig, receiptDest: 'group' })}
                                                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${tempConfig.receiptDest === 'group' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                            >
                                                                <Users className="w-3 h-3" /> GRUPO WHATSAPP
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-[2] space-y-1.5">
                                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Enlace / URL de Contacto</label>
                                                        <div className="relative">
                                                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                                            <input
                                                                type="text"
                                                                aria-label="Enlace de contacto"
                                                                title="Enlace de contacto"
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                value={tempConfig.receiptLink}
                                                                onChange={e => setTempConfig({ ...tempConfig, receiptLink: e.target.value })}
                                                                placeholder="https://wa.me/..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Día de Transferencia</p>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                                        <span className="text-xl font-black text-gray-800">{selectedProperty.transferDay || '--'}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Comisión Pactada</p>
                                                    <div className="flex items-center gap-2">
                                                        <Percent className="w-5 h-5 text-emerald-500" />
                                                        <span className="text-xl font-black text-gray-800">{selectedProperty.managementCommission || '--'}%</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Flujo de Pago</p>
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                                                        <span className="text-xs font-bold text-gray-700 leading-tight">
                                                            {getFlowLabel(selectedProperty.paymentFlow)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Suministros</p>
                                                    <div className="flex items-center gap-2">
                                                        <Droplets className="w-5 h-5 text-blue-500" />
                                                        <div>
                                                            <p className="text-sm font-black text-blue-900 leading-none">
                                                                {selectedProperty.suppliesConfig?.type === 'fixed'
                                                                    ? `Fijo: ${selectedProperty.suppliesConfig.fixedAmount}€`
                                                                    : 'A repartir'}
                                                            </p>
                                                            {selectedProperty.suppliesConfig?.type === 'fixed' && (
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-[10px] font-bold text-blue-500 leading-none">
                                                                        {selectedProperty.rooms.length} Habitaciones
                                                                    </p>
                                                                    {Object.entries(selectedProperty.suppliesConfig.roomOverrides || {}).length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {Object.entries(selectedProperty.suppliesConfig.roomOverrides || {}).map(([roomId, amount]) => {
                                                                                const rName = selectedProperty.rooms.find(r => r.id === roomId)?.name || roomId;
                                                                                return (
                                                                                    <span key={roomId} className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                                                                                        {rName}: {amount}€
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Titular de la Cuenta</p>
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-5 h-5 text-indigo-500" />
                                                            <span className="text-sm font-bold text-indigo-900 leading-tight">
                                                                {selectedProperty.bankAccountHolder || 'No definido'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block w-px h-8 bg-indigo-100" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Cuenta de Transferencia (IBAN)</p>
                                                        <div className="flex items-center gap-2">
                                                            <Landmark className="w-5 h-5 text-indigo-500" />
                                                            <span className="text-sm font-bold font-mono text-indigo-900 leading-tight">
                                                                {selectedProperty.bankAccount || 'No configurada'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedProperty.bankAccount && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedProperty.bankAccount || '');
                                                            alert("IBAN copiado al portapapeles");
                                                        }}
                                                        className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                                                    >
                                                        COPIAR IBAN
                                                    </button>
                                                )}
                                            </div>

                                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                                                        {selectedProperty.receiptDest === 'group' ? (
                                                            <Users className="w-5 h-5 text-emerald-600" />
                                                        ) : (
                                                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Envío de Justificantes</p>
                                                        <p className="text-sm font-bold text-emerald-900">
                                                            {selectedProperty.receiptDest === 'group' ? 'Grupo de WhatsApp' : 'Propietario (Chat Privado)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedProperty.receiptLink && (
                                                    <a
                                                        href={selectedProperty.receiptLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-[10px] font-black text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                                                    >
                                                        ABRIR CONTACTO <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <History className="w-5 h-5 text-gray-400" />
                                        Historial de Liquidaciones
                                    </h3>
                                    <button
                                        onClick={handleAddRecord}
                                        className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus size={14} />
                                        Añadir Mes
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b">
                                                <th className="px-6 py-4">Mes</th>
                                                <th className="px-6 py-4">Nº Factura</th>
                                                <th className="px-6 py-4">Estado</th>
                                                {selectedProperty.paymentFlow === 'tenant_rentia_owner' && (
                                                    <th className="px-6 py-4">Transf. Prop. (€)</th>
                                                )}
                                                <th className="px-6 py-4">Comisión Rentia (€)</th>
                                                <th className="px-6 py-4">Factura Enviada</th>
                                                <th className="px-6 py-4">Pago Completado</th>
                                                <th className="px-6 py-4 text-right">Borrar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedProperty.billingHistory && selectedProperty.billingHistory.length > 0 ? (
                                                selectedProperty.billingHistory.map((record, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-6 py-4 font-bold text-gray-700">{record.month}</td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="text"
                                                                aria-label="Número de factura"
                                                                title="Número de factura"
                                                                placeholder="Ej: 2024/001"
                                                                className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-gray-600 focus:ring-1 focus:ring-indigo-300 outline-none"
                                                                value={record.invoiceNumber || ''}
                                                                onChange={e => handleUpdateRecord(idx, { invoiceNumber: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select
                                                                value={record.status}
                                                                aria-label="Estado del pago"
                                                                title="Estado del pago"
                                                                onChange={e => handleUpdateRecord(idx, { status: e.target.value as any })}
                                                                className={`text-[10px] font-black px-2.5 py-1 rounded-full border outline-none appearance-none transition-colors ${getStatusColor(record.status)}`}
                                                            >
                                                                <option value="pending">Pendiente</option>
                                                                <option value="sent">Enviada</option>
                                                                <option value="paid">Pagado</option>
                                                            </select>
                                                        </td>
                                                        {selectedProperty.paymentFlow === 'tenant_rentia_owner' && (
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="number"
                                                                    aria-label="Cantidad al propietario"
                                                                    title="Cantidad al propietario"
                                                                    className="w-20 bg-gray-50 border border-gray-100 rounded px-2 py-1 text-xs font-mono font-bold text-gray-700 focus:ring-1 focus:ring-indigo-300 outline-none"
                                                                    value={record.ownerAmount || 0}
                                                                    onChange={e => handleUpdateRecord(idx, { ownerAmount: parseFloat(e.target.value) })}
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                aria-label="Comisión Rentia"
                                                                title="Comisión Rentia"
                                                                className="w-20 bg-blue-50 border border-blue-100 rounded px-2 py-1 text-xs font-mono font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-300 outline-none"
                                                                value={record.rentiaAmount || 0}
                                                                onChange={e => handleUpdateRecord(idx, { rentiaAmount: parseFloat(e.target.value) })}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="date"
                                                                aria-label="Fecha factura enviada"
                                                                title="Fecha factura enviada"
                                                                className="bg-transparent border-none focus:ring-0 text-xs text-gray-600 p-0"
                                                                value={record.invoiceSentDate || ''}
                                                                onChange={e => handleUpdateRecord(idx, { invoiceSentDate: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="date"
                                                                aria-label="Fecha pago completado"
                                                                title="Fecha pago completado"
                                                                className="bg-transparent border-none focus:ring-0 text-xs text-gray-600 p-0"
                                                                value={record.paymentDate || ''}
                                                                onChange={e => handleUpdateRecord(idx, { paymentDate: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDeleteRecord(idx)}
                                                                aria-label="Eliminar registro"
                                                                title="Eliminar registro"
                                                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={selectedProperty.paymentFlow === 'tenant_rentia_owner' ? 8 : 7} className="px-6 py-12 text-center text-gray-400 italic">
                                                        No hay registros. Pulsa "Añadir Mes" para comenzar.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Warnings / Tips */}
                            <div className={`p-6 rounded-2xl border flex items-start gap-4 shadow-sm transition-colors ${billingStatus?.type === 'overdue' ? 'bg-rose-50 border-rose-100' :
                                billingStatus?.type === 'near' || billingStatus?.type === 'process' ? 'bg-amber-50 border-amber-100' :
                                    'bg-indigo-50 border-indigo-100'
                                }`}>
                                <div className={`p-2 rounded-lg shadow-sm border ${billingStatus?.type === 'overdue' ? 'bg-white border-rose-200' :
                                    billingStatus?.type === 'near' || billingStatus?.type === 'process' ? 'bg-white border-amber-200' :
                                        'bg-white border-indigo-200'
                                    }`}>
                                    <AlertCircle className={`w-5 h-5 ${billingStatus?.type === 'overdue' ? 'text-rose-600' :
                                        billingStatus?.type === 'near' || billingStatus?.type === 'process' ? 'text-amber-600' :
                                            'text-indigo-600'
                                        }`} />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${billingStatus?.type === 'overdue' ? 'text-rose-900' :
                                        billingStatus?.type === 'near' || billingStatus?.type === 'process' ? 'text-amber-900' :
                                            'text-indigo-900'
                                        }`}>
                                        {billingStatus?.message}
                                    </h4>
                                    <p className={`text-xs mt-1 leading-relaxed ${billingStatus?.type === 'overdue' ? 'text-rose-700' :
                                        billingStatus?.type === 'near' ? 'text-amber-700' :
                                            'text-indigo-700'
                                        }`}>
                                        {selectedProperty.paymentFlow === 'tenant_rentia_owner'
                                            ? `Vivienda bajo flujo Rentia → Propietario. Liquidar comisión del ${selectedProperty.managementCommission}% + IVA sobre el bruto.`
                                            : `Vivienda bajo flujo Propietario → Rentia. Emitir factura de honorarios (${selectedProperty.managementCommission}% + IVA) tras cobro del propietario.`}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl opacity-60">
                            <Building size={60} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-bold">Selecciona una propiedad para gestionar su facturación</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
