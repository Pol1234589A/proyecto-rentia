
import React, { useState } from 'react';
// ... imports
import { initializeApp, deleteApp } from "firebase/app"; 
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseConfig, db } from '../../firebase';
import { UserPlus, Save, AlertCircle, CheckCircle, Loader2, CreditCard, MapPin, Phone, FileText, User } from 'lucide-react';
import { UserRole } from '../../contexts/AuthContext';
import { GDPRCheckbox } from '../common/SecurityComponents';

export const UserCreator: React.FC = () => {
  // ... (STATE KEPT AS IS) ...
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => { /* ... */ };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-rentia-blue" />
          Alta de Nuevo Usuario / Propietario
        </h3>
      </div>
      
      {/* Añadido overflow-y-auto para móviles */}
      <div className="p-6 overflow-y-auto">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm border shadow-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-6">
          {/* ... (Form Content kept exactly as is) ... */}
          {/* SECCIÓN 1: DATOS DE ACCESO Y ROL */}
          <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">1. Credenciales y Rol</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Rol de Usuario *</label>
                    <select 
                        value={role || 'tenant'}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className={`w-full p-2.5 border rounded-lg text-sm font-bold focus:ring-2 outline-none ${role === 'owner' ? 'border-purple-300 bg-purple-50 text-purple-900 focus:ring-purple-200' : 'border-gray-200 bg-white focus:ring-rentia-blue/30'}`}
                    >
                        <option value="owner">PROPIETARIO (Owner)</option>
                        <option value="tenant">Inquilino (Tenant)</option>
                        <option value="agency">Inmobiliaria (Agency)</option>
                        <option value="broker">Colaborador (Broker)</option>
                        <option value="worker">Trabajador (Worker)</option>
                        <option value="staff">Admin (Staff)</option>
                    </select>
                </div>
                {/* ... other inputs ... */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Email (Login) *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Contraseña *</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">2. Datos Personales / Fiscales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                {/* ... Resto de inputs (DNI, Tel, Address, IBAN) ... */}
              </div>
          </div>

          <GDPRCheckbox 
            checked={gdprAccepted}
            onChange={setGdprAccepted}
            label="Consentimiento de Registro"
          />

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
                type="submit" 
                disabled={loading}
                className="bg-rentia-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                {loading ? 'Creando Perfil...' : 'Confirmar Alta Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
