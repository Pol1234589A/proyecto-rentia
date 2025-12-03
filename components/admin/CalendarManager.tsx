
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Clock, MapPin, Loader2, ExternalLink, ShieldCheck, AlertTriangle, Settings, Save, Key, Mail, Lock, Plus, Trash2, X } from 'lucide-react';

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

export const CalendarManager: React.FC = () => {
  // Configuración con credenciales
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New Event Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
      title: '',
      time: '09:00',
      description: ''
  });

  // Helpers de Fecha
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajustar para que Lunes sea 0
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Initialize Google Identity Services
  useEffect(() => {
      if (window.google && config.clientId) {
          const client = window.google.accounts.oauth2.initTokenClient({
              client_id: config.clientId,
              scope: 'https://www.googleapis.com/auth/calendar.events',
              callback: (tokenResponse: any) => {
                  if (tokenResponse && tokenResponse.access_token) {
                      setAccessToken(tokenResponse.access_token);
                      // Una vez tenemos token, recargamos eventos con él (da acceso a privados)
                      fetchEvents(tokenResponse.access_token);
                  }
              },
          });
          setTokenClient(client);
      }
  }, [config.clientId]);

  useEffect(() => {
    if (config.apiKey && config.calendarId) {
        fetchEvents();
    }
  }, [currentDate, config]);

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
          alert("Por favor, configura primero el Client ID en ajustes.");
          setShowConfig(true);
      }
  };

  const fetchEvents = async (tokenOverride?: string) => {
    if (!config.apiKey || !config.calendarId) return;

    setLoading(true);
    setError(null);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0).toISOString();

    try {
      // Si tenemos token, usamos la API con Bearer (permite ver/editar privados). Si no, solo API Key (solo lectura pública).
      const token = tokenOverride || accessToken;
      const headers: any = {};
      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?key=${config.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error.message);
      }

      let googleEvents: GoogleEvent[] = [];
      if (data.items) {
        googleEvents = data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary,
          description: item.description,
          start: item.start,
          end: item.end,
          location: item.location,
          htmlLink: item.htmlLink,
          source: 'google'
        }));
      }

      setEvents(googleEvents);
      // Refresh selected day view if active
      if (selectedDay) {
          refreshSelectedDay(selectedDay, googleEvents);
      }

    } catch (err: any) {
      console.error("Error fetching Google Calendar:", err);
      setError("Error de sincronización. Si el calendario es privado, necesitas iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedDay = (day: number, allEvents: GoogleEvent[]) => {
      const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daysEvents = allEvents.filter(ev => {
        const startStr = ev.start.dateTime || ev.start.date;
        if (!startStr) return false;
        const evDate = new Date(startStr);
        const evCheck = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
        const dayCheck = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate());
        return evCheck.getTime() === dayCheck.getTime();
      });
      setSelectedDayEvents(daysEvents);
  };

  const handleCreateEvent = async () => {
      if (!accessToken) {
          handleAuthClick();
          return;
      }
      if (!selectedDay) return;

      setLoading(true);
      
      // Construct start/end DateTimes
      const [hours, mins] = newEvent.time.split(':').map(Number);
      const startDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay, hours, mins);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration default

      const eventPayload = {
          summary: newEvent.title,
          description: newEvent.description,
          start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'Europe/Madrid'
          },
          end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'Europe/Madrid'
          }
      };

      try {
          const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
              {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(eventPayload)
              }
          );

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error?.message || 'Failed to create event');
          }

          setShowAddModal(false);
          setNewEvent({ title: '', time: '09:00', description: '' });
          fetchEvents(); // Refresh UI
          alert("Evento creado en Google Calendar correctamente.");

      } catch (err: any) {
          console.error(err);
          alert(`Error al crear evento: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteEvent = async (eventId: string) => {
      if (!accessToken) {
          handleAuthClick();
          return;
      }
      if (!confirm("¿Seguro que quieres borrar este evento de Google Calendar?")) return;

      setLoading(true);
      try {
          const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${eventId}`,
              {
                  method: 'DELETE',
                  headers: {
                      'Authorization': `Bearer ${accessToken}`
                  }
              }
          );

          if (!response.ok) throw new Error('Failed to delete event');
          
          fetchEvents(); // Refresh
      } catch (err: any) {
          console.error(err);
          alert("Error al eliminar evento.");
      } finally {
          setLoading(false);
      }
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    refreshSelectedDay(day, events);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/30 border border-gray-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateCheck = new Date(year, month, day);
      const isToday = new Date().toDateString() === dateCheck.toDateString();
      
      const dayEvents = events.filter(ev => {
        const startStr = ev.start.dateTime || ev.start.date;
        if(!startStr) return false;
        const evStart = new Date(startStr);
        return evStart.getDate() === day && evStart.getMonth() === month && evStart.getFullYear() === year;
      });

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-24 md:h-32 border border-gray-100 p-2 relative cursor-pointer transition-colors group hover:bg-blue-50 ${isToday ? 'bg-blue-50/50' : 'bg-white'} ${selectedDay === day ? 'ring-2 ring-rentia-blue ring-inset z-10' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-rentia-blue text-white' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 rounded-full md:hidden">
                    {dayEvents.length}
                </span>
            )}
          </div>
          
          <div className="mt-1 space-y-1 overflow-hidden max-h-[calc(100%-24px)]">
            {dayEvents.slice(0, 3).map((ev, idx) => (
              <div key={idx} className="hidden md:block text-[10px] bg-green-50 text-green-800 border border-green-100 rounded px-1 py-0.5 truncate" title={ev.summary}>
                {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Todo el día'} {ev.summary}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="hidden md:block text-[9px] text-gray-400 pl-1">
                + {dayEvents.length - 3} más
              </div>
            )}
            
            <div className="flex gap-1 md:hidden mt-1 flex-wrap">
                {dayEvents.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                ))}
            </div>
          </div>
          
          {/* Add Button on Hover */}
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedDay(day); setShowAddModal(true); }}
            className="absolute bottom-1 right-1 p-1 bg-rentia-blue text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
            title="Añadir evento"
          >
              <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return days;
  };

  if (showConfig) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-rentia-black rounded-full text-rentia-gold">
                          <Settings className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 font-display">Configuración Google</h3>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Key className="w-3 h-3"/> Google API Key (Lectura)</label>
                          <input 
                            type="password" 
                            className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={config.apiKey}
                            onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Lock className="w-3 h-3"/> OAuth Client ID (Escritura)</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            placeholder="xxxx.apps.googleusercontent.com"
                            value={config.clientId}
                            onChange={(e) => setConfig({...config, clientId: e.target.value})}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Necesario para crear/borrar eventos.</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Calendar ID</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={config.calendarId}
                            onChange={(e) => setConfig({...config, calendarId: e.target.value})}
                          />
                      </div>
                      
                      <button 
                        onClick={saveConfig}
                        className="w-full bg-rentia-blue text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
                      >
                          <Save className="w-4 h-4" /> Guardar y Conectar
                      </button>
                      <button onClick={() => setShowConfig(false)} className="w-full text-gray-500 text-sm hover:underline mt-2">Cancelar</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
            <div className="px-4 font-bold text-lg w-32 text-center text-rentia-black">{monthNames[currentDate.getMonth()]}</div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <span className="text-xl font-light text-gray-400">{currentDate.getFullYear()}</span>
        </div>

        <div className="flex items-center gap-2">
          {!accessToken && (
              <button 
                onClick={handleAuthClick}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                title="Iniciar sesión para editar"
              >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" />
                  Conectar Cuenta
              </button>
          )}
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
              <Settings className="w-4 h-4" /> Config
          </button>
          <button 
            onClick={() => fetchEvents()}
            disabled={loading}
            className="flex items-center gap-2 bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full relative">
        
        {/* CALENDAR GRID */}
        <div className="flex-grow bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 bg-gray-200 gap-px border-b border-gray-200">
            {renderCalendar()}
          </div>
        </div>

        {/* SIDEBAR: DAY DETAILS */}
        <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-fit lg:h-auto">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-rentia-blue" />
              {selectedDay ? `${selectedDay} de ${monthNames[currentDate.getMonth()]}` : 'Detalles'}
            </h4>
            {selectedDay && (
                <button onClick={() => setShowAddModal(true)} className="p-1 hover:bg-gray-200 rounded text-rentia-blue" title="Añadir Evento">
                    <Plus className="w-4 h-4" />
                </button>
            )}
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[500px] lg:flex-grow space-y-3">
            {selectedDay ? (
              selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((ev, i) => (
                  <div key={i} className="bg-white border border-l-4 border-l-green-500 border-gray-100 p-3 rounded shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start">
                        <h5 className="font-bold text-sm text-gray-800 mb-1 pr-6">{ev.summary}</h5>
                        {accessToken && (
                            <button 
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {ev.start.dateTime 
                            ? `${new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                            : 'Todo el día'
                          }
                      </div>
                      {ev.description && <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{ev.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No hay eventos.</p>
                  <button onClick={() => setShowAddModal(true)} className="text-rentia-blue text-xs font-bold hover:underline mt-2">Crear uno nuevo</button>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona un día.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Nuevo Evento</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-black"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Título</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" 
                            placeholder="Reunión Cliente"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Hora Inicio</label>
                          <input 
                            type="time" 
                            className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" 
                            value={newEvent.time}
                            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                          <textarea 
                            className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none h-20 resize-none"
                            placeholder="Detalles..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          />
                      </div>
                      <div className="flex justify-end pt-2">
                          <button 
                            onClick={handleCreateEvent}
                            disabled={loading}
                            className="bg-rentia-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                              Guardar en Google
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
