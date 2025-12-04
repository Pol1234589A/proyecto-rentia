
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Clock, MapPin, Loader2, ExternalLink, ShieldCheck, AlertTriangle, Settings, Save, Key, Mail, Lock, Plus, Trash2, X, MoreHorizontal, LogIn } from 'lucide-react';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
  source: 'google' | 'crm';
}

declare global {
  interface Window {
    google: any;
  }
}

// Utility segura para formatear horas
const safeFormatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '--:--';
        return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
        return '--:--';
    }
};

export const CalendarManager: React.FC = () => {
  const [config, setConfig] = useState({
      apiKey: localStorage.getItem('rentia_calendar_api_key') || 'AIzaSyBwvExHJq8x8DA-TWhj7KSXAthFzoCP0Eg',
      calendarId: localStorage.getItem('rentia_calendar_id') || 'rentiaroom@gmail.com',
      clientId: localStorage.getItem('rentia_calendar_client_id') || ''
  });
  
  const [showConfig, setShowConfig] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate()); // Default to today
  const [selectedDayEvents, setSelectedDayEvents] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState<{ code?: number, message: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
      title: '',
      time: '09:00',
      description: ''
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Initialize Google Identity Services
  useEffect(() => {
      const initGoogle = () => {
          if (window.google && window.google.accounts && config.clientId) {
              try {
                  const client = window.google.accounts.oauth2.initTokenClient({
                      client_id: config.clientId,
                      scope: 'https://www.googleapis.com/auth/calendar.events',
                      callback: (tokenResponse: any) => {
                          if (tokenResponse && tokenResponse.access_token) {
                              setAccessToken(tokenResponse.access_token);
                              fetchEvents(tokenResponse.access_token);
                          }
                      },
                  });
                  setTokenClient(client);
              } catch (e) {
                  console.warn("Google Identity Services init failed", e);
              }
          }
      };
      
      if (!window.google) {
          const timer = setTimeout(initGoogle, 1000);
          return () => clearTimeout(timer);
      } else {
          initGoogle();
      }
  }, [config.clientId]);

  const fetchEvents = useCallback(async (tokenOverride?: string) => {
    if (!config.apiKey || !config.calendarId) return;

    setLoading(true);
    setError(null);
    
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const timeMin = new Date(year, month, 1).toISOString();
        const timeMax = new Date(year, month + 1, 0).toISOString();

        const token = tokenOverride || accessToken;
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?key=${config.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (data.error) {
            console.warn("Calendar API Error:", data.error.message);
            if (data.error.code === 404) setError({ code: 404, message: "Calendario no encontrado. Revisa el ID." });
            else if (data.error.code === 403) setError({ code: 403, message: "Este calendario es privado." });
            else setError({ code: data.error.code, message: data.error.message });
            setEvents([]);
            return;
        }

        let googleEvents: GoogleEvent[] = [];
        if (data.items && Array.isArray(data.items)) {
            googleEvents = data.items.map((item: any) => ({
                id: item.id,
                summary: item.summary || 'Sin título',
                description: item.description,
                start: item.start || {},
                end: item.end || {},
                location: item.location,
                htmlLink: item.htmlLink,
                source: 'google'
            }));
        }

        setEvents(googleEvents);
        
        // Refrescar vista del día seleccionado actual
        if (selectedDay) {
            refreshSelectedDay(selectedDay, googleEvents);
        }

    } catch (err: any) {
        console.error("Error fetching Google Calendar:", err);
        setError({ message: "Error de conexión." });
        setEvents([]);
    } finally {
        setLoading(false);
    }
  }, [config, currentDate, accessToken, selectedDay]);

  useEffect(() => {
    if (config.apiKey && config.calendarId) {
        fetchEvents();
    }
  }, [fetchEvents]);

  const saveConfig = () => {
      localStorage.setItem('rentia_calendar_api_key', config.apiKey);
      localStorage.setItem('rentia_calendar_id', config.calendarId);
      localStorage.setItem('rentia_calendar_client_id', config.clientId);
      setShowConfig(false);
      fetchEvents();
  };

  const handleAuthClick = () => {
      if (tokenClient) {
          tokenClient.requestAccessToken();
      } else {
          alert("Configura el Client ID primero en el botón de Configuración.");
          setShowConfig(true);
      }
  };

  const refreshSelectedDay = (day: number, allEvents: GoogleEvent[]) => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const dayStart = new Date(year, month, day);
      
      const daysEvents = allEvents.filter(ev => {
        const startStr = ev.start.dateTime || ev.start.date;
        if (!startStr) return false;
        try {
            const evDate = new Date(startStr);
            const evCheck = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
            const dayCheck = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate());
            return evCheck.getTime() === dayCheck.getTime();
        } catch (e) { return false; }
      });
      setSelectedDayEvents(daysEvents);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    refreshSelectedDay(day, events);
  };

  const handleCreateEvent = async () => {
      if (!accessToken || !selectedDay) return;
      setLoading(true);
      try {
        const [hours, mins] = newEvent.time.split(':').map(Number);
        const startDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay, hours, mins);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); 

        const eventPayload = {
            summary: newEvent.title,
            description: newEvent.description,
            start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Madrid' },
            end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Madrid' }
        };

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(eventPayload)
            }
        );

        if (!response.ok) throw new Error('Failed to create');
        setShowAddModal(false);
        setNewEvent({ title: '', time: '09:00', description: '' });
        fetchEvents();
      } catch (err: any) {
          alert(`Error: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteEvent = async (eventId: string) => {
      if (!accessToken || !confirm("¿Borrar evento?")) return;
      setLoading(true);
      try {
          await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${eventId}`,
              { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
          fetchEvents();
      } catch (err) {
          alert("Error al eliminar.");
      } finally {
          setLoading(false);
      }
  };

  // --- RENDER GRID CELLS ---
  const renderCalendarCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] bg-gray-50/30 rounded-lg"></div>);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateCheck = new Date(year, month, day);
      const isToday = new Date().toDateString() === dateCheck.toDateString();
      const isSelected = selectedDay === day;
      
      const dayEvents = events.filter(ev => {
        const startStr = ev.start.dateTime || ev.start.date;
        if(!startStr) return false;
        try {
            const evStart = new Date(startStr);
            if (isNaN(evStart.getTime())) return false;
            return evStart.getDate() === day && evStart.getMonth() === month && evStart.getFullYear() === year;
        } catch(e) { return false; }
      });

      cells.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`
            relative p-2 rounded-xl transition-all cursor-pointer border
            ${isSelected ? 'bg-blue-50 border-rentia-blue shadow-md z-10' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'}
            min-h-[80px] md:min-h-[100px] flex flex-col justify-between group
          `}
        >
          {/* Day Number */}
          <div className="flex justify-between items-start">
            <span className={`
                flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                ${isToday ? 'bg-rentia-black text-white' : (isSelected ? 'text-rentia-blue' : 'text-gray-700')}
            `}>
              {day}
            </span>
            {dayEvents.length > 0 && (
                <span className="hidden md:flex bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full items-center">
                    {dayEvents.length}
                </span>
            )}
          </div>
          
          {/* Events Indicators */}
          <div className="flex flex-col gap-1 mt-1">
            {/* Desktop View: Text Bars */}
            <div className="hidden md:flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((ev, idx) => (
                    <div key={idx} className="bg-blue-100 text-blue-900 text-[9px] px-1.5 py-0.5 rounded truncate font-medium border border-blue-200" title={ev.summary}>
                        {ev.summary}
                    </div>
                ))}
                {dayEvents.length > 3 && <span className="text-[9px] text-gray-400 pl-1">+{dayEvents.length - 3} más</span>}
            </div>

            {/* Mobile View: Dots */}
            <div className="flex md:hidden gap-1 flex-wrap content-end h-full">
                {dayEvents.slice(0, 5).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                ))}
                {dayEvents.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300 text-[6px] flex items-center justify-center">+</div>}
            </div>
          </div>
        </div>
      );
    }
    return cells;
  };

  // --- CONFIG MODAL ---
  if (showConfig) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-xl">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <div className="p-3 bg-gray-100 rounded-full text-gray-600">
                          <Settings className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 font-display">Ajustes Calendario</h3>
                  </div>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Key className="w-3 h-3"/> API Key (Lectura)</label>
                          <input type="password" value={config.apiKey} onChange={(e) => setConfig({...config, apiKey: e.target.value})} className="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Client ID (Escritura)</label>
                          <input type="text" value={config.clientId} onChange={(e) => setConfig({...config, clientId: e.target.value})} className="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Calendar ID</label>
                          <input type="text" value={config.calendarId} onChange={(e) => setConfig({...config, calendarId: e.target.value})} className="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                          <button onClick={() => setShowConfig(false)} className="flex-1 text-gray-600 bg-gray-100 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                          <button onClick={saveConfig} className="flex-1 bg-rentia-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"><Save className="w-4 h-4"/> Guardar</button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN VIEW ---
  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-xl overflow-hidden relative border border-gray-200 shadow-sm animate-in fade-in">
      
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-b border-gray-200 gap-4 shadow-sm z-20">
        {/* Month Navigation */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <button onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDay(1); }} className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-600 transition-all active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
            <span className="font-bold text-gray-800 w-32 text-center select-none text-sm md:text-base capitalize">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDay(1); }} className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-600 transition-all active:scale-95"><ChevronRight className="w-5 h-5"/></button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!accessToken && (
                <button onClick={handleAuthClick} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" /> Login
                </button>
            )}
            <button onClick={() => setShowConfig(true)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Settings className="w-5 h-5" /></button>
            <button onClick={() => fetchEvents()} disabled={loading} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 active:scale-95">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
                <span className="hidden sm:inline">Actualizar</span>
            </button>
        </div>
      </div>

      {error && error.code !== 403 && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-xs flex items-center gap-2 border-b border-red-100">
              <AlertTriangle className="w-4 h-4" /> {error.message}
          </div>
      )}

      {/* CONTENT AREA */}
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden relative">
        
        {/* CALENDAR GRID */}
        <div className="flex-grow overflow-y-auto p-2 sm:p-4 bg-gray-50/30 relative">
            {/* Private Calendar Warning Overlay */}
            {error && error.code === 403 && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm border border-red-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Acceso Restringido</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Este calendario es privado ({config.calendarId}).<br/>
                            Debes iniciar sesión con tu cuenta de Google para ver los eventos.
                        </p>
                        <button 
                            onClick={handleAuthClick}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-1"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 bg-white rounded-full p-0.5" alt="G" />
                            Conectar con Google
                        </button>
                    </div>
                </div>
            )}

            {/* Week Headers */}
            <div className="grid grid-cols-7 mb-2 px-1">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {renderCalendarCells()}
            </div>
        </div>

        {/* SIDEBAR (DETAILS) */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col h-[40%] lg:h-full shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:shadow-none z-30">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-rentia-blue" />
                    {selectedDay} de {monthNames[currentDate.getMonth()]}
                </h4>
                {selectedDay && (
                    <button onClick={() => setShowAddModal(true)} className="w-8 h-8 flex items-center justify-center bg-rentia-black text-white rounded-full hover:bg-gray-800 shadow-md transition-transform hover:scale-110 active:scale-95">
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 flex-grow bg-white">
                {selectedDay && selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((ev, i) => (
                        <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative border-l-4 border-l-rentia-blue">
                            <div className="flex justify-between items-start mb-1">
                                <h5 className="font-bold text-sm text-gray-800 pr-6 leading-tight">{ev.summary}</h5>
                                {accessToken && (
                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5 font-mono text-rentia-blue bg-blue-50 w-fit px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3" />
                                    {ev.start.dateTime ? safeFormatTime(ev.start.dateTime) : 'Todo el día'}
                                </div>
                                {ev.description && <p className="mt-1 text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-100">{ev.description}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                        <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No hay eventos para este día.</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-4 text-rentia-blue text-xs font-bold hover:underline">Crear Evento</button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* NEW EVENT MODAL */}
      {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-800">Nuevo Evento</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Título</label>
                          <input type="text" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-rentia-blue focus:ring-2 focus:ring-rentia-blue/20 outline-none transition-all" placeholder="Reunión Cliente" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Hora Inicio</label>
                          <input type="time" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-rentia-blue focus:ring-2 focus:ring-rentia-blue/20 outline-none transition-all" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Descripción</label>
                          <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-rentia-blue focus:ring-2 focus:ring-rentia-blue/20 outline-none h-24 resize-none transition-all" placeholder="Detalles..." value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
                      </div>
                      <button onClick={handleCreateEvent} disabled={loading} className="w-full bg-rentia-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 mt-2">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                          Guardar Evento
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
