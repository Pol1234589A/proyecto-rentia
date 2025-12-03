import React, { useState } from 'react';
// Fix: Use 'firebase/compat/app' for app management functions.
import firebase from "firebase/compat/app";
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseConfig, db } from '../../firebase';
import { UserPlus, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UserRole } from '../../contexts/AuthContext';

export const UserCreator: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Usamos un ID único para la app secundaria para evitar conflictos de "App already exists"
    const secondaryAppName = `SecondaryApp-${Date.now()}`;
    let secondaryApp: any;

    try {
      // Fix: Call initializeApp from the compat import.
      secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Crear usuario en Authentication (en la app secundaria)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      // 2.1 Actualizar perfil de Auth INMEDIATAMENTE para asegurar que el displayName esté disponible
      await updateProfile(newUser, { displayName: name });

      // 3. Crear documento en Firestore (usando la instancia DB principal del Admin)
      // SEGURIDAD: Es vital que el usuario nazca con 'active: true' para pasar las reglas de seguridad
      await setDoc(doc(db, "users", newUser.uid), {
        email: email.toLowerCase(),
        displayName: name,
        role: role,
        createdAt: new Date().toISOString(),
        active: true // Flag de seguridad obligatorio
      });

      // 4. Cerrar sesión en la app secundaria para limpiar
      await signOut(secondaryAuth);

      // 5. Feedback y Limpieza
      setMessage({ type: 'success', text: `Usuario ${email} creado correctamente con rol ${role}.` });
      setEmail('');
      setPassword('');
      setName('');
      
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      let errorMsg = "Error al crear usuario.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "El email ya está registrado.";
      if (error.code === 'auth/weak-password') errorMsg = "La contraseña debe tener al menos 6 caracteres.";
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      // Limpieza robusta de la app secundaria
      if (secondaryApp) {
          try {
            // Fix: Call delete() on the app instance for compat mode.
            await secondaryApp.delete();
          } catch (e) {
            console.warn("Error limpiando app secundaria:", e);
          }
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-rentia-blue" />
          Alta de Nuevo Usuario
        </h3>
      </div>
      
      <div className="p-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre Completo</label>
                <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm"
                    placeholder="Ej. Juan Pérez"
                />
            </div>

            {/* Rol */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Rol de Usuario</label>
                <select 
                    value={role || 'tenant'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm bg-white"
                >
                    <option value="tenant">Inquilino (Tenant)</option>
                    <option value="owner">Propietario (Owner)</option>
                    <option value="agency">Inmobiliaria (Agency)</option>
                    <option value="broker">Colaborador (Broker)</option>
                    <option value="worker">Trabajador (Worker)</option>
                    <option value="staff">Admin (Staff)</option>
                </select>
            </div>

            {/* Email */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm"
                    placeholder="usuario@ejemplo.com"
                />
            </div>

            {/* Password */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contraseña</label>
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm"
                    placeholder="Mínimo 6 caracteres"
                />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
                type="submit" 
                disabled={loading}
                className="bg-rentia-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};