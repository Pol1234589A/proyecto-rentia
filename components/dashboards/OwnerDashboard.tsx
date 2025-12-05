
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Property, Room } from '../../data/rooms';
import { Contract } from '../../types';
import { VisitRecord } from '../admin/tools/VisitsLog';
import { Home, Users, Wallet, Footprints, Clock, CheckCircle, X, DollarSign, Calendar, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'tenants' | 'financials'>('overview');
  
  // Data
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get Properties for this owner
        // NOTE: Admin must assign 'ownerId' to property in RoomManager for this to work
        const propsQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
        const propsSnap = await getDocs(propsQuery);
        
        const ownerProperties: Property[] = [];
        propsSnap.forEach(doc => {
            ownerProperties.push({ ...doc.data(), id: doc.id } as Property);
        });
        setProperties(ownerProperties);

        const propIds = ownerProperties.map(p => p.id);

        if (propIds.length > 0) {
            // 2. Get Visits for these properties
            // Can't use 'in' for > 10 items, but usually owners have few properties.
            const visitsQuery = query(collection(db, "room_visits"), where("propertyId", "in", propIds));
            const visitsSnap = await getDocs(visitsQuery); // Using getDocs for simplicity, could be onSnapshot
            const visitsList: VisitRecord[] = [];
            visitsSnap.forEach(doc => visitsList.push({ ...doc.data(), id: doc.id } as VisitRecord));
            // Sort by date desc locally
            visitsList.sort((a,b) => (b.visitDate?.seconds || 0) - (a.visitDate?.seconds || 0));
            setVisits(visitsList);

            // 3. Get Contracts for these properties to show Tenant info
            const contractsQuery = query(collection(db, "contracts"), where("propertyId", "in", propIds), where("status", "==", "active"));
            const contractsSnap = await getDocs(contractsQuery);
            const contractsList: Contract[] = [];
            contractsSnap.forEach(doc => contractsList.push({ ...doc.data(), id: doc.id } as Contract));
            setActiveContracts(contractsList);
        }

      } catch (error) {
        console.error("Error fetching owner data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
      let totalRooms = 0;
      let occupiedRooms = 0;
      let monthlyGross = 0;
      let monthlyNet = 0;

      properties.forEach(prop => {
          totalRooms += prop.rooms.length;
          prop.rooms.forEach(room => {
              if (room.status === 'occupied') {
                  occupiedRooms++;
                  const contract = activeContracts.find(c => c.roomId === room.id);
                  const rent = contract ? contract.rentAmount : room.price; // Use real contract price if available
                  monthlyGross += rent;

                  // Calculate Rentia Fee
                  let fee = 0;
                  if (room.commissionType === 'fixed') {
                      fee = room.commissionValue || 0;
                  } else {
                      // Percentage (Default 10% if not set)
                      const pct = room.commissionValue || 10;
                      fee = (rent * pct) / 100;
                  }
                  // Add VAT to fee (21%)
                  const feeWithVat = fee * 1.21;
                  monthlyNet += (rent - feeWithVat);
              }
          });
      });

      return {
          occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
          grossIncome: monthlyGross,
          netIncome: monthlyNet,
          rentiaFeeTotal: monthlyGross - monthlyNet
      };
  }, [properties, activeContracts]);

  // --- HELPERS ---
  const getFirstName = (fullName: string) => {
      return fullName.split(' ')[0];
  };

  const getVisitBadge = (outcome: string) => {
      switch(outcome) {
          case 'successful': return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3"/> Exitosa</span>;
          case 'unsuccessful': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><X className="w-3 h-3"/> No Exitosa</span>;
          default: return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Pendiente</span>;
      }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-rentia-black font-display">Portal del Propietario</h1>
          <p className="text-gray-500">Bienvenido a tu área de gestión de activos.</p>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-full text-rentia-blue"><Home className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Ocupación</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.occupancy}%</p>
                <p className="text-xs text-green-600 mt-1">Cartera activa</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-full text-green-600"><DollarSign className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Ingresos Brutos (Mes)</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.grossIncome.toLocaleString()} €</p>
                <p className="text-xs text-gray-400 mt-1">Antes de honorarios y gastos</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-full text-purple-600"><Wallet className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Neto Estimado</span>
                </div>
                <p className="text-3xl font-bold text-purple-700">{stats.netIncome.toLocaleString()} €</p>
                <p className="text-xs text-gray-400 mt-1">Ingreso final proyectado</p>
            </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Resumen</button>
            <button onClick={() => setActiveTab('visits')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'visits' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Registro Visitas</button>
            <button onClick={() => setActiveTab('tenants')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'tenants' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Estado Inquilinos</button>
            <button onClick={() => setActiveTab('financials')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'financials' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Finanzas Detalladas</button>
        </div>

        {/* CONTENT */}
        
        {/* 1. VISITS LOG */}
        {(activeTab === 'overview' || activeTab === 'visits') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-rentia-blue" /> Últimas Visitas
                    </h3>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{visits.length} registros</span>
                </div>
                <div className="overflow-x-auto">
                    {visits.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No hay visitas registradas recientemente.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Comercial</th>
                                    <th className="p-4">Inmueble</th>
                                    <th className="p-4">Resultado</th>
                                    <th className="p-4">Comentarios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {visits.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-600 whitespace-nowrap text-xs">
                                            {v.visitDate?.toDate ? v.visitDate.toDate().toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-4 font-medium">{v.workerName}</td>
                                        <td className="p-4 text-gray-600">
                                            <div className="font-bold text-gray-800 text-xs">{v.propertyName}</div>
                                            <div className="text-[10px]">{v.roomName}</div>
                                        </td>
                                        <td className="p-4">{getVisitBadge(v.outcome)}</td>
                                        <td className="p-4 text-gray-500 text-xs max-w-xs truncate" title={v.comments}>{v.comments || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}

        {/* 2. TENANTS STATUS */}
        {(activeTab === 'overview' || activeTab === 'tenants') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-rentia-blue" /> Estado de Inquilinos
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    {properties.map(prop => (
                        <div key={prop.id} className="border rounded-xl overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b font-bold text-sm text-gray-700 flex items-center gap-2">
                                <Home className="w-4 h-4" /> {prop.address}
                            </div>
                            <div className="divide-y divide-gray-100">
                                {prop.rooms.map(room => {
                                    const contract = activeContracts.find(c => c.roomId === room.id);
                                    const tenantName = contract ? getFirstName(contract.tenantName) : '---';
                                    const isOccupied = room.status === 'occupied';
                                    const suppliesType = prop.suppliesConfig?.type === 'fixed' ? 'Fijo' : 'A Repartir';
                                    const suppliesCost = prop.suppliesConfig?.type === 'fixed' ? `${prop.suppliesConfig.fixedAmount}€` : 'Según facturas';

                                    return (
                                        <div key={room.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-12 rounded-full ${isOccupied ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{room.name}</h4>
                                                    <p className={`text-xs font-bold uppercase ${isOccupied ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {isOccupied ? 'Alquilada' : 'Disponible'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase block">Inquilino</span>
                                                    <span className="font-medium text-gray-800">{isOccupied ? tenantName : '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase block">Renta</span>
                                                    <span className="font-bold text-gray-800">{isOccupied ? (contract?.rentAmount || room.price) : '-'} €</span>
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <span className="text-xs text-gray-400 uppercase block">Suministros</span>
                                                    <span className="text-gray-600 text-xs">{isOccupied ? `${suppliesType} (${suppliesCost})` : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 3. FINANCIALS */}
        {(activeTab === 'overview' || activeTab === 'financials') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-rentia-blue" /> Desglose Mensual
                    </h3>
                    <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">Nota sobre Honorarios</p>
                            <p className="opacity-90">Los honorarios de gestión de RentiaRoom se calculan individualmente por habitación según la configuración del contrato (Fijo o %). Incluyen el IVA correspondiente (21%).</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Propiedad / Habitación</th>
                                    <th className="p-3 text-right">Renta Bruta</th>
                                    <th className="p-3 text-right text-red-600">Honorarios Rentia (+IVA)</th>
                                    <th className="p-3 text-right rounded-r-lg text-green-700">Neto Propietario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {properties.map(prop => (
                                    <React.Fragment key={prop.id}>
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={4} className="p-3 font-bold text-gray-800 text-xs uppercase tracking-wide border-b border-gray-200">
                                                {prop.address}
                                            </td>
                                        </tr>
                                        {prop.rooms.filter(r => r.status === 'occupied').map(room => {
                                            const contract = activeContracts.find(c => c.roomId === room.id);
                                            const rent = contract ? contract.rentAmount : room.price;
                                            
                                            // Calculate Fee
                                            let feeBase = 0;
                                            if (room.commissionType === 'fixed') {
                                                feeBase = room.commissionValue || 0;
                                            } else {
                                                const pct = room.commissionValue || 10;
                                                feeBase = (rent * pct) / 100;
                                            }
                                            const feeTotal = feeBase * 1.21;
                                            const net = rent - feeTotal;

                                            return (
                                                <tr key={room.id} className="hover:bg-gray-50">
                                                    <td className="p-3 pl-6 text-gray-600">{room.name}</td>
                                                    <td className="p-3 text-right font-medium">{rent.toFixed(2)} €</td>
                                                    <td className="p-3 text-right text-red-500 font-medium">-{feeTotal.toFixed(2)} €</td>
                                                    <td className="p-3 text-right font-bold text-green-700">{net.toFixed(2)} €</td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                                <tr className="bg-gray-100 border-t-2 border-gray-200 font-bold">
                                    <td className="p-4 text-right">TOTALES</td>
                                    <td className="p-4 text-right text-lg">{stats.grossIncome.toFixed(2)} €</td>
                                    <td className="p-4 text-right text-red-600">-{stats.rentiaFeeTotal.toFixed(2)} €</td>
                                    <td className="p-4 text-right text-xl text-green-700">{stats.netIncome.toFixed(2)} €</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
