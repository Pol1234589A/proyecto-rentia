
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Property, Room } from '../../data/rooms';
import { Contract, Candidate, Task, OwnerAdjustment } from '../../types';
import { VisitRecord } from '../admin/tools/VisitsLog';
import { Home, Users, Wallet, Footprints, Clock, CheckCircle, X, DollarSign, Calendar, TrendingUp, AlertCircle, Loader2, Lock, Shield, Key, UserCheck, FileText, XCircle, Search, Image as ImageIcon, MapPin, AlertTriangle, Lightbulb, User, Briefcase, Gift } from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { currentUser, isSimulated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'candidates' | 'incidents' | 'tenants' | 'financials' | 'security'>('overview');
  
  // Data
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [incidents, setIncidents] = useState<Task[]>([]); // Tasks usadas como incidencias
  const [adjustments, setAdjustments] = useState<OwnerAdjustment[]>([]); // Ajustes y Descuentos

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Month Selector for Financials
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get Properties for this owner
        const propsQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
        const propsSnap = await getDocs(propsQuery);
        
        const ownerProperties: Property[] = [];
        propsSnap.forEach(doc => {
            ownerProperties.push({ ...doc.data(), id: doc.id } as Property);
        });
        // Ordenar propiedades por dirección
        ownerProperties.sort((a,b) => a.address.localeCompare(b.address));
        setProperties(ownerProperties);

        const propIds = ownerProperties.map(p => p.id);

        if (propIds.length > 0) {
            // 2. Get Visits for these properties
            const visitsQuery = query(collection(db, "room_visits"), where("propertyId", "in", propIds));
            const visitsSnap = await getDocs(visitsQuery);
            const visitsList: VisitRecord[] = [];
            visitsSnap.forEach(doc => visitsList.push({ ...doc.data(), id: doc.id } as VisitRecord));
            visitsList.sort((a,b) => (b.visitDate?.seconds || 0) - (a.visitDate?.seconds || 0));
            setVisits(visitsList);

            // 3. Get Candidates (Pipeline) for these properties
            const candidatesQuery = query(collection(db, "candidate_pipeline"), where("propertyId", "in", propIds));
            const candidatesSnap = await getDocs(candidatesQuery);
            const candidatesList: Candidate[] = [];
            candidatesSnap.forEach(doc => candidatesList.push({ ...doc.data(), id: doc.id } as Candidate));
            // Ordenar por fecha reciente
            candidatesList.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
            setCandidates(candidatesList);

            // 4. Get Contracts for these properties
            const contractsQuery = query(collection(db, "contracts"), where("propertyId", "in", propIds), where("status", "==", "active"));
            const contractsSnap = await getDocs(contractsQuery);
            const contractsList: Contract[] = [];
            contractsSnap.forEach(doc => contractsList.push({ ...doc.data(), id: doc.id } as Contract));
            setActiveContracts(contractsList);

            // 5. Get Incidents (Tasks) for these properties
            const incidentsQuery = query(collection(db, "tasks"), where("propertyId", "in", propIds));
            const incidentsSnap = await getDocs(incidentsQuery);
            const incidentsList: Task[] = [];
            incidentsSnap.forEach(doc => incidentsList.push({ ...doc.data(), id: doc.id } as Task));
            incidentsList.sort((a,b) => {
                const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000).getTime() : 0;
                return dateB - dateA;
            });
            setIncidents(incidentsList);

            // 6. Get Adjustments
            const adjQuery = query(collection(db, "adjustments"), where("ownerId", "==", currentUser.uid));
            const adjSnap = await getDocs(adjQuery);
            const adjList: OwnerAdjustment[] = [];
            adjSnap.forEach(doc => adjList.push({ ...doc.data(), id: doc.id } as OwnerAdjustment));
            setAdjustments(adjList);
        }

      } catch (error) {
        console.error("Error fetching owner data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // --- HELPER: Parse cleaning hours ---
  const calculateCleaningCost = (prop: Property): number => {
      if (!prop.cleaningConfig || !prop.cleaningConfig.enabled) return 0;
      
      const { days, hours, costPerHour } = prop.cleaningConfig;
      if (!days || days.length === 0 || !costPerHour) return 0;

      // Parse hours string "10:00 - 13:00" -> 3 hours
      let duration = 0;
      try {
          const [startStr, endStr] = hours.split('-').map(s => s.trim());
          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);
          
          const startDate = new Date(0, 0, 0, startH, startM);
          const endDate = new Date(0, 0, 0, endH, endM);
          
          duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      } catch (e) {
          duration = 0;
      }

      if (duration <= 0) return 0;

      const weeklyHours = duration * days.length;
      // Promedio mensual (4.33 semanas/mes)
      return Math.round(weeklyHours * costPerHour * 4.33); 
  };

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
      let totalRooms = 0;
      let occupiedRooms = 0;
      let monthlyGross = 0;
      let monthlyNet = 0;

      properties.forEach(prop => {
          totalRooms += prop.rooms.length;
          let propGross = 0;
          let propFees = 0;

          prop.rooms.forEach(room => {
              if (room.status === 'occupied') {
                  occupiedRooms++;
                  const contract = activeContracts.find(c => c.roomId === room.id);
                  const rent = contract ? contract.rentAmount : room.price; 
                  propGross += rent;

                  let fee = 0;
                  if (room.commissionType === 'fixed') {
                      fee = room.commissionValue || 0;
                  } else {
                      const pct = room.commissionValue || 10;
                      fee = (rent * pct) / 100;
                  }
                  propFees += fee * 1.21; // + IVA
              }
          });

          // Subtract Cleaning Cost
          const cleaningCost = calculateCleaningCost(prop);
          
          monthlyGross += propGross;
          monthlyNet += (propGross - propFees - cleaningCost);
      });

      return {
          occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
          grossIncome: monthlyGross,
          netIncome: monthlyNet,
          rentiaFeeTotal: monthlyGross - monthlyNet // Rough estimate
      };
  }, [properties, activeContracts]);

  // --- PASSWORD CHANGE HANDLER ---
  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
          return;
      }
      if (newPassword.length < 6) {
          setPasswordMsg({ type: 'error', text: 'Mínimo 6 caracteres.' });
          return;
      }
      if (isSimulated) {
          setPasswordMsg({ type: 'error', text: 'No puedes cambiar la contraseña en modo "Login Maestro". Entra con la contraseña real del usuario.' });
          return;
      }

      setChangingPass(true);
      setPasswordMsg(null);

      try {
          if (auth.currentUser) {
              await updatePassword(auth.currentUser, newPassword);
              setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
              setNewPassword('');
              setConfirmPassword('');
          } else {
              setPasswordMsg({ type: 'error', text: 'No hay sesión activa.' });
          }
      } catch (error: any) {
          console.error(error);
          if (error.code === 'auth/requires-recent-login') {
              setPasswordMsg({ type: 'error', text: 'Por seguridad, debes cerrar sesión y volver a entrar para cambiar la contraseña.' });
          } else {
              setPasswordMsg({ type: 'error', text: 'Error al cambiar contraseña.' });
          }
      } finally {
          setChangingPass(false);
      }
  };

  // --- HELPERS ---
  const getFirstName = (fullName: string) => fullName.split(' ')[0];

  const getVisitBadge = (outcome: string) => {
      switch(outcome) {
          case 'successful': return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3"/> Exitosa</span>;
          case 'unsuccessful': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><X className="w-3 h-3"/> No Exitosa</span>;
          default: return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Pendiente</span>;
      }
  };

  const getCandidateStatus = (status: string) => {
      switch(status) {
          case 'pending_review': return { label: 'Analizando Solvencia...', style: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Search className="w-3 h-3"/> };
          case 'approved': return { label: 'Perfil Apto (Filtro Superado)', style: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle className="w-3 h-3"/> };
          case 'rejected': return { label: 'No Apto / Descartado', style: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3"/> };
          case 'archived': return { label: 'Archivado (No seleccionado)', style: 'bg-gray-100 text-gray-600 border-gray-200', icon: <FileText className="w-3 h-3"/> };
          case 'rented': return { label: '¡Seleccionado! (Firmado)', style: 'bg-green-100 text-green-800 border-green-200', icon: <Key className="w-3 h-3"/> };
          default: return { label: status, style: 'bg-gray-50', icon: null };
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
          {isSimulated && (
              <div className="mt-2 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                  <Shield className="w-4 h-4" /> Estás en modo "Login Maestro" (Vista de Administrador)
              </div>
          )}
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
            <button onClick={() => setActiveTab('visits')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'visits' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Visitas</button>
            <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'candidates' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><UserCheck className="w-4 h-4"/> Candidatos</button>
            <button onClick={() => setActiveTab('incidents')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'incidents' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><AlertTriangle className="w-4 h-4"/> Incidencias</button>
            <button onClick={() => setActiveTab('tenants')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'tenants' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Estado Inquilinos</button>
            <button onClick={() => setActiveTab('financials')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'financials' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Finanzas</button>
            <button onClick={() => setActiveTab('security')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'bg-rentia-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><Lock className="w-3 h-3" /> Seguridad</button>
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

        {/* 2. CANDIDATES */}
        {activeTab === 'candidates' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-rentia-blue" /> Candidatos & Estado del Filtrado
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Sigue el proceso de selección de inquilinos en tiempo real.</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 gap-4">
                    {candidates.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                            <Search className="w-12 h-12 opacity-20 mb-2"/>
                            <p>No hay candidatos en proceso actualmente.</p>
                        </div>
                    ) : (
                        candidates.map(candidate => {
                            const statusInfo = getCandidateStatus(candidate.status);
                            return (
                                <div key={candidate.id} className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-800 text-lg">{getFirstName(candidate.candidateName)}</h4>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Perfil Oculto</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            <span className="font-bold">{candidate.propertyName}</span> • {candidate.roomName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Registrado el: {candidate.submittedAt?.toDate ? candidate.submittedAt.toDate().toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-auto flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border ${statusInfo.style}`}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </div>
                                        {candidate.closureReason && (candidate.status === 'rejected' || candidate.status === 'archived') && (
                                            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-xs text-right border border-red-100">
                                                {candidate.closureReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* 3. INCIDENTS & RECOMMENDATIONS (NEW) */}
        {activeTab === 'incidents' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rentia-blue" /> Incidencias & Mejoras
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Estado de reparaciones y recomendaciones para aumentar el valor del activo.</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {incidents.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400 flex flex-col items-center">
                            <CheckCircle className="w-12 h-12 opacity-20 mb-2 text-green-500"/>
                            <p>¡Todo en orden! No hay incidencias activas.</p>
                        </div>
                    ) : (
                        incidents.map(task => {
                            // Lógica de tipo: "Incidencia" si es Mantenimiento, "Mejora" si es Reformas/Otros
                            const isMaintenance = task.category === 'Mantenimiento';
                            const isImprovement = task.category === 'Reformas' || task.category === 'Operaciones';
                            
                            // Lógica de Origen (Visual): Asumimos que todo viene de Staff/Sistema a menos que se indique explícitamente
                            const isTenantReport = task.title.toLowerCase().includes('inquilino') || task.description.toLowerCase().includes('reporta');

                            return (
                                <div key={task.id} className={`border rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden ${task.status === 'Completada' ? 'opacity-60 bg-gray-50 border-gray-200' : 'bg-white shadow-sm hover:shadow-md transition-shadow'}`}>
                                    {/* Color Stripe based on type */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMaintenance ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                    
                                    <div className="flex justify-between items-start pl-2">
                                        <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${isMaintenance ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {isMaintenance ? <AlertTriangle className="w-3 h-3"/> : <Lightbulb className="w-3 h-3"/>}
                                            {isMaintenance ? 'Incidencia' : 'Recomendación'}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.status === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {task.status || 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="pl-2">
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{task.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded border border-gray-100 italic">"{task.description}"</p>
                                    </div>

                                    <div className="mt-auto pl-2 pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            {isTenantReport ? (
                                                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                                    <User className="w-3 h-3" /> Origen: Inquilino
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                    <Briefcase className="w-3 h-3" /> Rentia Staff
                                                </div>
                                            )}
                                        </div>
                                        <span>{task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* 4. TENANTS STATUS - CARDS REDESIGN */}
        {(activeTab === 'overview' || activeTab === 'tenants') && (
            <div className="space-y-8">
                {properties.map(prop => (
                    <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-rentia-blue" />
                            <h3 className="font-bold text-gray-800">{prop.address}</h3>
                            <span className="text-xs text-gray-500">({prop.city})</span>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prop.rooms.map(room => {
                                const contract = activeContracts.find(c => c.roomId === room.id);
                                const tenantName = contract ? getFirstName(contract.tenantName) : '---';
                                const isOccupied = room.status === 'occupied';
                                const suppliesType = prop.suppliesConfig?.type === 'fixed' ? 'Fijo' : 'A Repartir';
                                const suppliesCost = prop.suppliesConfig?.type === 'fixed' ? `${prop.suppliesConfig.fixedAmount}€` : 'S/Factura';
                                
                                const roomImage = room.images && room.images.length > 0 ? room.images[0] : null;

                                return (
                                    <div key={room.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col h-full">
                                        {/* Room Image */}
                                        <div className="h-40 bg-gray-100 relative group overflow-hidden">
                                            {roomImage ? (
                                                <img 
                                                    src={roomImage} 
                                                    alt={room.name} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                    <ImageIcon className="w-12 h-12 opacity-50" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm ${isOccupied ? 'bg-green-100 text-green-700' : 'bg-gray-800 text-white'}`}>
                                                    {isOccupied ? 'Alquilada' : 'Disponible'}
                                                </span>
                                            </div>
                                            
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                                                <h4 className="text-white font-bold text-lg">{room.name}</h4>
                                            </div>
                                        </div>

                                        {/* Room Details */}
                                        <div className="p-4 flex-grow flex flex-col justify-between">
                                            <div className="space-y-3 mb-4">
                                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                    <span className="text-xs text-gray-400 uppercase font-bold">Inquilino</span>
                                                    <span className={`font-bold ${isOccupied ? 'text-gray-800' : 'text-gray-300'}`}>
                                                        {isOccupied ? tenantName : 'Vacío'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                    <span className="text-xs text-gray-400 uppercase font-bold">Renta</span>
                                                    <span className="font-mono font-bold text-rentia-blue">
                                                        {isOccupied ? (contract?.rentAmount || room.price) : room.price} €
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-400 uppercase font-bold">Suministros</span>
                                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                        {suppliesType} ({suppliesCost})
                                                    </span>
                                                </div>
                                            </div>

                                            {isOccupied && contract && (
                                                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                                                    <span>Fin contrato:</span>
                                                    <span className="font-bold text-gray-600">{new Date(contract.endDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* 5. FINANCIALS - ENHANCED WITH ADJUSTMENTS */}
        {(activeTab === 'overview' || activeTab === 'financials') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-rentia-blue" /> Liquidación Mensual
                    </h3>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="bg-white border rounded px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:ring-1 focus:ring-rentia-blue"
                    />
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">Nota sobre Liquidación</p>
                            <p className="opacity-90">Este desglose incluye alquileres, deducción de honorarios, costes de limpieza fijos y cualquier ajuste extraordinario (reparaciones o bonificaciones) aplicado en el mes seleccionado.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Concepto</th>
                                    <th className="p-3 text-right text-green-700">Ingresos (+)</th>
                                    <th className="p-3 text-right text-red-600">Gastos/Honorarios (-)</th>
                                    <th className="p-3 text-right text-purple-600">Ajustes (+/-)</th>
                                    <th className="p-3 text-right rounded-r-lg text-gray-900">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {properties.map(prop => {
                                    // Calcular datos por propiedad
                                    const propAdjustments = adjustments.filter(adj => adj.propertyId === prop.id && adj.appliedToMonth === selectedMonth);
                                    let propRent = 0;
                                    let propFees = 0;
                                    let cleaningCost = calculateCleaningCost(prop);
                                    let totalAdj = 0;

                                    prop.rooms.forEach(r => {
                                        if (r.status === 'occupied') {
                                            const c = activeContracts.find(con => con.roomId === r.id);
                                            const rent = c ? c.rentAmount : r.price;
                                            propRent += rent;
                                            
                                            // Fee calc
                                            let fee = 0;
                                            if (r.commissionType === 'fixed') fee = r.commissionValue || 0;
                                            else fee = (rent * (r.commissionValue || 10)) / 100;
                                            propFees += fee * 1.21;
                                        }
                                    });

                                    propAdjustments.forEach(adj => {
                                        if (adj.type === 'discount') totalAdj += adj.amount; // Positivo para el owner (le damos dinero o descontamos de nuestra comisión)
                                        else totalAdj -= adj.amount; // Negativo (le cobramos algo extra)
                                    });

                                    const propNet = propRent - propFees - cleaningCost + totalAdj;
                                    
                                    // Formatear día de transferencia
                                    const transferDayText = prop.transferDay ? `Día ${prop.transferDay}` : '-';

                                    return (
                                        <React.Fragment key={prop.id}>
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={5} className="p-3 border-b border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">{prop.address}</span>
                                                        <span className="text-[10px] font-normal text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> Transferencia Rentia: <strong>{transferDayText}</strong>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* Renta */}
                                            <tr>
                                                <td className="p-3 pl-6 text-gray-600">Alquiler Habitaciones</td>
                                                <td className="p-3 text-right font-medium">{propRent.toFixed(2)} €</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                            </tr>

                                            {/* Honorarios */}
                                            <tr>
                                                <td className="p-3 pl-6 text-gray-600">Honorarios Gestión (IVA inc.)</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                                <td className="p-3 text-right text-red-500">-{propFees.toFixed(2)} €</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                                <td className="p-3 text-right text-gray-300">-</td>
                                            </tr>

                                            {/* Limpieza */}
                                            {cleaningCost > 0 && (
                                                <tr>
                                                    <td className="p-3 pl-6 text-gray-600">Servicio Limpieza Mensual</td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                    <td className="p-3 text-right text-red-500">-{cleaningCost.toFixed(2)} €</td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                </tr>
                                            )}

                                            {/* Ajustes Individuales */}
                                            {propAdjustments.map(adj => (
                                                <tr key={adj.id}>
                                                    <td className="p-3 pl-6 text-purple-700 flex items-center gap-2">
                                                        <Gift className="w-3 h-3"/> {adj.concept}
                                                    </td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                    <td className={`p-3 text-right font-bold ${adj.type === 'discount' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {adj.type === 'discount' ? '+' : '-'}{adj.amount.toFixed(2)} €
                                                    </td>
                                                    <td className="p-3 text-right text-gray-300">-</td>
                                                </tr>
                                            ))}

                                            {/* Subtotal Propiedad */}
                                            <tr className="border-t border-gray-200 bg-gray-50">
                                                <td className="p-3 pl-6 font-bold text-gray-800 text-xs uppercase">Neto Propiedad</td>
                                                <td className="p-3 text-right"></td>
                                                <td className="p-3 text-right"></td>
                                                <td className="p-3 text-right"></td>
                                                <td className="p-3 text-right font-bold text-lg text-green-800">{propNet.toFixed(2)} €</td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* 6. SECURITY (CAMBIAR CONTRASEÑA) */}
        {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-lg mx-auto mt-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-rentia-blue" /> Seguridad de la Cuenta
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Actualiza tu contraseña de acceso.</p>
                </div>
                
                <div className="p-6">
                    {isSimulated && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm mb-4">
                            <strong>Aviso:</strong> Estás accediendo con la "Contraseña Maestra" o en modo Simulado. No es posible cambiar la contraseña desde aquí porque no tienes una sesión real autenticada. Debes cerrar sesión y entrar con la contraseña actual del usuario.
                        </div>
                    )}

                    {passwordMsg && (
                        <div className={`p-4 rounded-lg text-sm mb-4 border ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {passwordMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
                            <div className="relative">
                                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isSimulated}
                                    className="w-full pl-10 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none disabled:bg-gray-100"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isSimulated}
                                    className="w-full pl-10 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none disabled:bg-gray-100"
                                    placeholder="Repite la nueva contraseña"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSimulated || changingPass}
                            className="w-full bg-rentia-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {changingPass ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                            Actualizar Contraseña
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
