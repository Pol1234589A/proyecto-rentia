
import React, { useState, useEffect } from 'react';
import { Users, Building, AlertCircle, CheckCircle, BarChart3, RefreshCw, LayoutDashboard, Calculator, Briefcase, Wrench, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Trash2, Save, X, DollarSign, Calendar as CalendarIcon, Filter, Download, Pencil, ChevronLeft, ChevronRight, PieChart, Landmark, ChevronDown, Wallet, CreditCard, Clock, Zap, Droplets, Flame, Wifi, Settings, Receipt, Split, Info, MessageCircle, Share2, ClipboardList, UserCheck, Mail, Phone, ArrowRight, UserPlus, Archive, Send, Home, DoorOpen, Menu, Grid, Footprints, MapPin, Percent, Quote, Sparkles } from 'lucide-react';
import { UserCreator } from '../admin/UserCreator';
import { FileAnalyzer } from '../admin/FileAnalyzer';
import { RoomManager } from '../admin/RoomManager';
import { SalesCRM } from '../admin/SalesCRM';
import { ProfitCalculator } from '../admin/ProfitCalculator';
import { FeedGenerator } from '../admin/FeedGenerator';
import { ContractManager } from '../admin/ContractManager';
import { CalendarManager } from '../admin/CalendarManager';
import { SupplyCalculator } from '../admin/SupplyCalculator';
import { SocialInbox } from '../admin/SocialInbox';
import { TaskManager } from '../admin/TaskManager';
import { VisitsLog } from '../admin/tools/VisitsLog';
import { CandidateManager } from '../admin/tools/CandidateManager';
import { AccountingPanel } from '../admin/tools/AccountingPanel';
import { SuppliesPanel } from '../admin/tools/SuppliesPanel';
import { NewsManager } from '../admin/NewsManager'; // Importado
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { properties as staticProperties } from '../../data/rooms';
import { useAuth } from '../../contexts/AuthContext';

const MOTIVATIONAL_QUOTES = [
    "El único modo de hacer un gran trabajo es amar lo que haces. – Steve Jobs",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día. – Robert Collier",
    "No busques el momento perfecto, solo busca el momento y hazlo perfecto.",
    "La excelencia no es un acto, es un hábito. – Aristóteles",
    "Tu actitud, no tu aptitud, determinará tu altitud. – Zig Ziglar",
    "Si puedes soñarlo, puedes hacerlo. – Walt Disney",
    "El fracaso es la oportunidad de empezar de nuevo, con más inteligencia. – Henry Ford",
    "La calidad significa hacer lo correcto cuando nadie está mirando. – Henry Ford",
    "Cree que puedes y casi lo habrás logrado. – Theodore Roosevelt",
    "No cuentes los días, haz que los días cuenten. – Muhammad Ali",
    "El secreto para salir adelante es comenzar. – Mark Twain",
    "La disciplina es el puente entre metas y logros. – Jim Rohn",
    "Trabajar duro por algo que no nos importa se llama estrés. Trabajar duro por algo que amamos se llama pasión.",
    "El éxito no se logra sólo con cualidades especiales. Es sobre todo un trabajo de constancia, de método y de organización.",
    "Un cliente satisfecho es la mejor estrategia de negocio de todas. – Michael LeBoeuf",
    "La mejor forma de predecir el futuro es crearlo. – Peter Drucker",
    "La confianza en sí mismo es el primer secreto del éxito. – Ralph Waldo Emerson",
    "No te detengas cuando estés cansado. Detente cuando hayas terminado.",
    "El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos. – Michael Jordan",
    "La motivación es lo que te pone en marcha. El hábito es lo que hace que sigas. – Jim Ryun",
    "Si no te gusta algo, cámbialo. Si no puedes cambiarlo, cambia tu actitud. – Maya Angelou",
    "La suerte tiene lugar cuando la preparación se encuentra con la oportunidad. – Séneca",
    "Hazlo con pasión o no lo hagas.",
    "La única forma de hacer un buen trabajo es amando lo que haces.",
    "Nunca es demasiado tarde para ser lo que podrías haber sido. – George Eliot",
    "El éxito es ir de fracaso en fracaso sin perder el entusiasmo. – Winston Churchill",
    "La persistencia puede cambiar el fracaso en un logro extraordinario. – Matt Biondi",
    "Mantén tu cara siempre hacia la luz del sol y las sombras caerán detrás de ti. – Walt Whitman",
    "Lo que haces hoy puede mejorar todos tus mañanas. – Ralph Marston",
    "La creatividad es la inteligencia divirtiéndose. – Albert Einstein",
    "Nunca soñé con el éxito. Trabajé para llegar a él. – Estée Lauder",
    "El optimismo es la fe que conduce al logro. Nada puede hacerse sin esperanza y confianza. – Helen Keller",
    "Siempre parece imposible hasta que se hace. – Nelson Mandela",
    "No esperes. El tiempo nunca será el justo. – Napoleon Hill",
    "Conviértete en la persona que atraiga los resultados que buscas. – Jim Cathcart",
    "No juzgues cada día por la cosecha que recoges, sino por las semillas que plantas. – Robert Louis Stevenson",
    "El éxito depende del esfuerzo. – Sófocles",
    "Hacer lo mejor en este momento nos pone en la mejor posición para el siguiente momento. – Oprah Winfrey",
    "La verdadera oportunidad de éxito reside en la persona, no en el trabajo.",
    "Cada problema es un regalo: sin problemas no creceríamos. – Tony Robbins",
    "El fracaso no es lo opuesto al éxito, es parte del éxito.",
    "Si no estás dispuesto a arriesgar lo inusual, tendrás que conformarte con lo ordinario. – Jim Rohn",
    "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.",
    "La gente exitosa y no exitosa no varían mucho en sus habilidades. Varían en sus deseos de alcanzar su potencial. – John Maxwell",
    "Si haces lo que siempre has hecho, obtendrás lo que siempre has conseguido. – Tony Robbins",
    "La acción es la clave fundamental de todo éxito. – Pablo Picasso",
    "Da siempre lo mejor de ti. Lo que plantes ahora, lo cosecharás más tarde. – Og Mandino",
    "La paciencia, la persistencia y el sudor hacen una combinación invencible para el éxito. – Napoleon Hill",
    "El único lugar donde el éxito viene antes que el trabajo es en el diccionario. – Vidal Sassoon",
    "No tengas miedo de renunciar a lo bueno para ir a por lo grandioso. – John D. Rockefeller",
    "El éxito suele llegar a aquellos que están demasiado ocupados para buscarlo. – Henry David Thoreau",
    "En medio de la dificultad reside la oportunidad. – Albert Einstein",
    "Lo único imposible es aquello que no intentas.",
    "Tus clientes más insatisfechos son tu mayor fuente de aprendizaje. – Bill Gates",
    "Calidad es más importante que cantidad. Un 'home run' es mucho mejor que dos dobles. – Steve Jobs",
    "La innovación distingue a los líderes de los seguidores. – Steve Jobs",
    "El trabajo en equipo hace que el sueño funcione.",
    "Solos podemos hacer poco, juntos podemos hacer mucho. – Helen Keller",
    "El servicio al cliente no es un departamento, es una actitud.",
    "Cada interacción es una oportunidad para causar una impresión positiva.",
    "Sé el cambio que quieres ver en el mundo. – Mahatma Gandhi",
    "Lo que consigues al alcanzar tus metas no es tan importante como en lo que te conviertes.",
    "No mires el reloj; haz lo que él hace. Sigue adelante. – Sam Levenson",
    "La diferencia entre lo ordinario y lo extraordinario es ese pequeño extra.",
    "El éxito es caer nueve veces y levantarse diez. – Bon Jovi",
    "Todo logro empieza con la decisión de intentarlo.",
    "Las oportunidades no pasan, las creas tú. – Chris Grosser",
    "Trabaja en silencio, que el éxito haga todo el ruido.",
    "La mejor venganza es el éxito masivo. – Frank Sinatra",
    "No levantes la voz, mejora tu argumento.",
    "El conocimiento es poder. – Francis Bacon",
    "La educación es el arma más poderosa que puedes usar para cambiar el mundo. – Nelson Mandela",
    "Si quieres ir rápido, ve solo. Si quieres ir lejos, ve acompañado.",
    "Ninguno de nosotros es tan bueno como todos nosotros juntos. – Ray Kroc",
    "La actitud es una pequeña cosa que hace una gran diferencia. – Winston Churchill",
    "El éxito no se mide en dinero, sino en la diferencia que marcas en las personas.",
    "Liderazgo es la capacidad de transformar la visión en realidad. – Warren Bennis",
    "La gestión eficaz es poner primero lo primero.",
    "Eficiencia es hacer las cosas bien; eficacia es hacer las cosas correctas. – Peter Drucker",
    "Una meta sin un plan es solo un deseo.",
    "Convierte los muros que aparecen en tu vida en peldaños hacia tus objetivos.",
    "El riesgo más grande es no tomar ninguno.",
    "Haz de cada día tu obra maestra. – John Wooden",
    "El entusiasmo mueve el mundo. – Arthur Balfour",
    "La cortesía es el aceite que lubrica las relaciones humanas.",
    "Escuchar es tan importante como hablar.",
    "La sonrisa es la llave que abre muchas puertas.",
    "Pequeños detalles hacen grandes diferencias en la experiencia del cliente.",
    "Organización es lo que haces antes de hacer algo, para que cuando lo hagas, no se complique.",
    "La claridad lleva al poder.",
    "Enfócate en la solución, no en el problema.",
    "Sé proactivo, no reactivo.",
    "El valor de una idea radica en el uso de la misma. – Thomas Edison",
    "La simplicidad es la máxima sofisticación. – Leonardo da Vinci",
    "El tiempo es el recurso más valioso; úsalo sabiamente.",
    "Aprende de ayer, vive para hoy, espera para mañana.",
    "Tu trabajo va a llenar gran parte de tu vida, la única forma de estar realmente satisfecho es hacer lo que creas es un gran trabajo.",
    "No se trata de tener tiempo, se trata de sacar tiempo.",
    "La excelencia es un viaje, no un destino."
];

const MotivationalBanner: React.FC = () => {
    const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
                setFade(true);
            }, 500); // Tiempo para el fade out antes de cambiar
        }, 15000); // Cambiar cada 15 segundos

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gradient-to-r from-slate-900 to-rentia-blue rounded-xl p-6 shadow-lg text-white mb-6 relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rentia-gold/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="hidden md:flex p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
                    <Quote className="w-8 h-8 text-rentia-gold fill-current" />
                </div>
                
                <div className="flex-1 min-h-[60px] flex items-center justify-center md:justify-start">
                    <p 
                        className={`text-lg md:text-xl font-medium font-display leading-relaxed transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                    >
                        "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                    </p>
                </div>

                <div className="hidden md:block">
                    <Sparkles className="w-6 h-6 text-rentia-gold opacity-50 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'real_estate' | 'accounting' | 'tools' | 'contracts' | 'calendar' | 'supplies' | 'calculator' | 'social' | 'tasks' | 'visits'>('overview');
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'tasks' | 'candidates' | 'properties' | 'menu' | 'accounting' | 'supplies' | 'calendar' | 'contracts' | 'social' | 'calculator' | 'tools' | 'visits'>('overview');
  const [mobilePropertyView, setMobilePropertyView] = useState<'rent' | 'sale'>('rent');

  const [stats, setStats] = useState({
    totalRooms: 0,
    occupancyRate: 0,
    activeIncidents: 0,
    monthlyRevenue: 0,
    vacantRooms: 0,
    estimatedCommission: 0
  });
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>(''); // For calculator pre-selection
  const [totalRealBalance, setTotalRealBalance] = useState(0); // Only for overview card

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' });

  // --- LOAD DATA EFFECTS ---
  useEffect(() => {
    // 1. Properties & Stats
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      let totalRoomsCount = 0;
      let occupiedCount = 0;
      let revenueCount = 0;
      let renovationCount = 0;
      let totalCommission = 0; 
      
      const firestoreProps: any[] = [];
      snapshot.forEach((doc) => {
        firestoreProps.push({ ...doc.data(), id: doc.id });
      });

      const dbIds = new Set(firestoreProps.map(p => p.id));
      const missingStatics = staticProperties.filter(p => !dbIds.has(p.id));
      
      const allProps = [...firestoreProps, ...missingStatics].map(data => {
          let inferredConfig = data.suppliesConfig;
          if (!inferredConfig && data.rooms && data.rooms.length > 0) {
              const firstRoomExpense = data.rooms[0].expenses.toLowerCase();
              if (firstRoomExpense.includes('fijos') || firstRoomExpense.includes('incluidos')) {
                  inferredConfig = { type: 'fixed', fixedAmount: 50 }; 
              } else {
                  inferredConfig = { type: 'shared' };
              }
          }
          return { ...data, suppliesConfig: inferredConfig };
      });

      allProps.forEach((data: any) => {
        if (data.rooms && Array.isArray(data.rooms)) {
          data.rooms.forEach((room: any) => {
            totalRoomsCount++;
            if (room.status === 'occupied') {
              occupiedCount++;
              revenueCount += Number(room.price) || 0;
              
              if (room.commissionValue) {
                  if (room.commissionType === 'fixed') {
                      totalCommission += Number(room.commissionValue);
                  } else {
                      const baseCommission = (Number(room.price) * Number(room.commissionValue) / 100);
                      totalCommission += baseCommission * 1.21;
                  }
              }
            }
            if (room.specialStatus === 'renovation') {
              renovationCount++;
            }
          });
        }
      });

      allProps.sort((a,b) => a.address.localeCompare(b.address));
      setPropertiesList(allProps);
      
      if (!selectedPropId && allProps.length > 0) setSelectedPropId(allProps[0].id);

      setStats({
        totalRooms: totalRoomsCount,
        occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0,
        monthlyRevenue: revenueCount,
        activeIncidents: renovationCount,
        vacantRooms: totalRoomsCount - occupiedCount,
        estimatedCommission: totalCommission
      });
      setLoadingStats(false);
    });

    // 2. Overview Balance (Lightweight listener)
    const qAccounting = query(collection(db, "accounting"));
    const unsubscribeAccounting = onSnapshot(qAccounting, (snapshot) => {
        let balance = 0;
        snapshot.forEach((doc) => {
            const d = doc.data();
            if (d.type === 'income') balance += d.amount;
            else balance -= d.amount;
        });
        setTotalRealBalance(balance);
    });
    
    // 3. Pending Candidates Count
    const qPending = query(collection(db, "candidate_pipeline"), where("status", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snap) => {
        setPendingCandidatesCount(snap.size);
    });

    return () => { unsubscribeProps(); unsubscribeAccounting(); unsubPending(); };
  }, []);

  const handleSendCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.propertyId || !newCandidate.roomId || !newCandidate.candidateName) {
        return alert("Completa todos los campos: propiedad, habitación y nombre.");
    }
    const prop = propertiesList.find(p => p.id === newCandidate.propertyId);
    const room = prop?.rooms.find((r:any) => r.id === newCandidate.roomId);
    try {
        await addDoc(collection(db, "candidate_pipeline"), {
            ...newCandidate,
            propertyName: prop?.address || 'N/A',
            roomName: room?.name || 'N/A',
            submittedBy: currentUser?.displayName || 'Staff',
            submittedAt: serverTimestamp(),
            status: 'pending_review'
        });
        setShowCandidateModal(false);
        setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' });
        alert('Candidato enviado a filtrado correctamente.');
    } catch (error) {
        console.error(error);
        alert('Error al enviar candidato.');
    }
  };

    const desktopTools = [
        { id: 'tasks', label: 'Tareas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'real_estate', label: 'Inmobiliaria', icon: <Building className="w-4 h-4" /> },
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-4 h-4" /> },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-4 h-4" /> },
        { id: 'calculator', label: 'Calculadora', icon: <Split className="w-4 h-4" /> },
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-4 h-4" /> }, 
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="w-4 h-4" /> },
    ];

    const mobileMenuOptions = [
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-6 h-6"/>, color: 'bg-blue-100 text-blue-600' },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-6 h-6"/>, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-6 h-6"/>, color: 'bg-green-100 text-green-600' },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-6 h-6"/>, color: 'bg-red-100 text-red-600' },
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-6 h-6"/>, color: 'bg-purple-100 text-purple-600' },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-6 h-6"/>, color: 'bg-pink-100 text-pink-600' },
        { id: 'calculator', label: 'Calc. Inversión', icon: <Split className="w-6 h-6"/>, color: 'bg-orange-100 text-orange-600' },
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="w-6 h-6"/>, color: 'bg-gray-100 text-gray-600' },
    ];

    const renderMobileContent = () => {
        // Wrapper for mobile sub-pages
        const SubSectionWrapper = ({ title, children }: { title: string, children?: React.ReactNode }) => (
            <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-100 py-2 z-10">
                    <button onClick={() => setActiveMobileTab('menu')} className="p-2 bg-white rounded-full shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-gray-600"/>
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                </div>
                <div className="flex-grow overflow-y-auto pb-24">
                    {children}
                </div>
            </div>
        );

        switch (activeMobileTab) {
            case 'overview': return (
                <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-4 h-full overflow-y-auto pb-24 px-4 pt-4">
                    {/* Motivational Quote for Mobile */}
                    <MotivationalBanner />

                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer"
                            onClick={() => {
                                setActiveMobileTab('candidates');
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-800 text-sm">Candidatos Pendientes</h4>
                                    <p className="text-xs text-orange-700">Requieren tu aprobación</p>
                                </div>
                            </div>
                            <span className="bg-orange-600 text-white font-bold text-lg px-3 py-1 rounded-full">{pendingCandidatesCount}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Total Habs</span><span className="text-2xl font-bold text-gray-800 block mt-1">{loadingStats ? '-' : stats.totalRooms}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación</span><span className={`text-2xl font-bold block mt-1 ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Incidencias</span><span className="text-2xl font-bold text-red-600 block mt-1">{loadingStats ? '-' : stats.activeIncidents}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Vacías</span><span className="text-2xl font-bold text-orange-500 block mt-1">{loadingStats ? '-' : stats.vacantRooms}</span></div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-2 border-l-4 border-l-purple-500">
                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-purple-500"/> Comisión Mensual (Est)</span>
                            <span className="text-3xl font-bold text-purple-700 block mt-1">
                                {loadingStats ? '-' : stats.estimatedCommission.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                            </span>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-2"><span className="text-xs text-gray-500 uppercase font-bold">Balance Caja</span><span className={`text-2xl font-bold block mt-1 ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span></div>
                    </div>
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 p-4 rounded-lg font-bold hover:bg-green-100 border border-green-200 flex justify-between items-center"><span className="flex items-center gap-2"><UserPlus className="w-5 h-5"/> Enviar Candidato</span><ArrowRight/></button>
                    <button onClick={() => setActiveMobileTab('tasks')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-lg font-bold hover:bg-blue-100 border border-blue-200 flex justify-between items-center"><span className="flex items-center gap-2"><ClipboardList className="w-5 h-5"/> Nueva Tarea</span><ArrowRight/></button>
                </div>
            );
            case 'tasks': return <div className="animate-in fade-in h-full overflow-hidden"><TaskManager /></div>;
            case 'candidates': return (
                <div className="animate-in fade-in h-full overflow-y-auto pb-24">
                    <CandidateManager />
                </div>
            );
            case 'properties': return (
                <div className="flex flex-col h-full">
                    <div className="flex p-2 bg-gray-100 gap-2 shrink-0 rounded-lg mb-2">
                        <button 
                            onClick={() => setMobilePropertyView('rent')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'rent' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Alquiler
                        </button>
                        <button 
                            onClick={() => setMobilePropertyView('sale')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'sale' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Venta (CRM)
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pb-24">
                        {mobilePropertyView === 'rent' ? (
                            <RoomManager />
                        ) : (
                            <SalesCRM />
                        )}
                    </div>
                </div>
            );
            
            case 'menu': return (
                <div className="animate-in slide-in-from-bottom-4 p-2 h-full overflow-y-auto pb-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Más Herramientas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {mobileMenuOptions.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setActiveMobileTab(opt.id as any)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all aspect-square"
                            >
                                <div className={`p-3 rounded-full ${opt.color}`}>
                                    {opt.icon}
                                </div>
                                <span className="font-bold text-gray-700 text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );

            case 'visits': return <SubSectionWrapper title="Visitas"><VisitsLog /></SubSectionWrapper>;
            case 'accounting': return <SubSectionWrapper title="Contabilidad"><AccountingPanel /></SubSectionWrapper>;
            case 'calendar': return <SubSectionWrapper title="Calendario"><CalendarManager /></SubSectionWrapper>;
            case 'supplies': return <SubSectionWrapper title="Suministros"><SuppliesPanel properties={propertiesList} /></SubSectionWrapper>;
            case 'contracts': return <SubSectionWrapper title="Contratos"><ContractManager onClose={() => setActiveMobileTab('menu')} /></SubSectionWrapper>;
            case 'social': return <SubSectionWrapper title="Mensajería"><SocialInbox /></SubSectionWrapper>;
            case 'calculator': return <SubSectionWrapper title="Calculadora Suministros"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></SubSectionWrapper>;
            case 'tools': return (
                <SubSectionWrapper title="Herramientas Admin">
                    <div className="space-y-4">
                        <NewsManager /> {/* NEW: News Manager for Mobile */}
                        <UserCreator />
                        <FileAnalyzer />
                        <ProfitCalculator />
                    </div>
                </SubSectionWrapper>
            );
        }
    };
  
    // MAIN RENDER (Desktop)
  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-4 md:p-6 animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="p-4 md:p-6 mb-4 sm:mb-6 md:bg-white rounded-xl md:shadow-sm md:border md:border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-rentia-black flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-rentia-blue" />
                Panel de Control
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Sistema Integrado de Gestión Empresarial</p>
          </div>
          
          <div className="hidden md:flex flex-wrap gap-1 justify-end bg-gray-100 p-1 rounded-lg max-w-full">
             <button onClick={() => setActiveTab('overview')} className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <BarChart3 className="w-3.5 h-3.5" /> Resumen
             </button>
             {desktopTools.map(tool => (
                 <button key={tool.id} onClick={() => setActiveTab(tool.id as any)} className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === tool.id ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                     {tool.icon} {tool.label}
                 </button>
             ))}
          </div>
        </header>

        {/* --- CONTENT AREA (DUAL RENDER) --- */}
        <div className="md:hidden pb-20 flex flex-col h-[calc(100vh-80px)]">
            {renderMobileContent()}
        </div>
        
        <div className="hidden md:block">
            {/* DESKTOP CONTENT RENDER */}
            {activeTab === 'overview' && ( 
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    
                    {/* MOTIVATIONAL QUOTE WIDGET */}
                    <MotivationalBanner />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Total Habitaciones</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-gray-800">{loadingStats ? '-' : stats.totalRooms}</span><Building className="w-6 h-6 text-blue-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación Actual</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span><Users className="w-6 h-6 text-green-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Habitaciones Vacías</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-orange-600">{loadingStats ? '-' : stats.vacantRooms}</span><DoorOpen className="w-6 h-6 text-orange-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 relative overflow-hidden">
                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-purple-500"/> Comisión Mensual (Est)</span>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-3xl font-bold text-purple-700">
                                    {loadingStats ? '-' : stats.estimatedCommission.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                                </span>
                                <Landmark className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Balance Total (Caja)</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-medium ml-1">€</span></span><Landmark className="w-6 h-6 text-gray-100 absolute right-4 top-4 transform scale-150" /></div></div>
                    </div>
                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 flex items-center justify-between shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
                            onClick={() => {
                                const element = document.getElementById('candidate-manager');
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-full text-orange-600 shadow-sm border border-orange-100">
                                    <UserCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-900 text-xl">Tienes {pendingCandidatesCount} candidatos pendientes de revisión</h4>
                                    <p className="text-sm text-orange-700">Haz clic aquí para ir al gestor y aprobarlos o rechazarlos.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-orange-400" />
                        </div>
                    )}
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200 text-left flex justify-between shadow-sm mb-8"><div className="flex items-center gap-3"><UserPlus className="w-5 h-5"/><span>Enviar Nuevo Candidato al Pipeline</span></div><ArrowRight className="w-5 h-5"/></button>
                    <div id="candidate-manager" className="mt-8">
                        <CandidateManager />
                    </div>
                </div>
            )}
            
            {activeTab === 'tasks' && <div className="animate-in slide-in-from-bottom-4 duration-300"><TaskManager /></div>}
            {activeTab === 'real_estate' && <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300"><RoomManager /><SalesCRM /></div>}
            {activeTab === 'contracts' && <div className="animate-in slide-in-from-bottom-4 duration-300"><ContractManager onClose={() => setActiveTab('real_estate')} /></div>}
            {activeTab === 'calendar' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><CalendarManager /></div>}
            {activeTab === 'calculator' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></div>}
            {activeTab === 'social' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SocialInbox /></div>}
            {activeTab === 'visits' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><VisitsLog /></div>}
            {activeTab === 'supplies' && <div className="animate-in slide-in-from-bottom-4 duration-300"><SuppliesPanel properties={propertiesList} /></div>}
            {activeTab === 'accounting' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AccountingPanel /></div>}
            
            {activeTab === 'tools' && ( 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300">
                    <NewsManager /> {/* NEW: Added News Manager here */}
                    <FeedGenerator />
                    <UserCreator />
                    <FileAnalyzer />
                    <ProfitCalculator />
                </div> 
            )}
        </div>
        
        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-5 z-50">
            <button onClick={() => setActiveMobileTab('overview')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'overview' ? 'text-rentia-blue' : 'text-gray-400'}`}><BarChart3 className="w-5 h-5"/><span className="text-[10px] font-bold">Resumen</span></button>
            <button onClick={() => setActiveMobileTab('tasks')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}><ClipboardList className="w-5 h-5"/><span className="text-[10px] font-bold">Tareas</span></button>
            <button onClick={() => setActiveMobileTab('candidates')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}><UserCheck className="w-5 h-5"/><span className="text-[10px] font-bold">Candidatos</span></button>
            <button onClick={() => setActiveMobileTab('properties')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'properties' ? 'text-rentia-blue' : 'text-gray-400'}`}><Home className="w-5 h-5"/><span className="text-[10px] font-bold">Inmuebles</span></button>
            <button onClick={() => setActiveMobileTab('menu')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'menu' ? 'text-rentia-blue' : 'text-gray-400'}`}><Grid className="w-5 h-5"/><span className="text-[10px] font-bold">Más</span></button>
        </div>

        {/* --- MODAL PARA CANDIDATOS (RETAINED) --- */}
        {showCandidateModal && ( 
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600"/> Enviar Candidato</h3>
                        <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label>
                                <select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label>
                                <select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{propertiesList.find(p => p.id === newCandidate.propertyId)?.rooms.map((r:any) => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Candidato *</label>
                            <input required type="text" className="w-full p-2 border rounded text-sm font-bold" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                <input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Info Adicional</label>
                            <textarea className="w-full p-2 border rounded text-sm h-20 resize-none" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><Send className="w-4 h-4"/> Enviar a Pipeline</button>
                    </div>
                </form>
            </div> 
        )}
      </div>
    </div>
  );
};
