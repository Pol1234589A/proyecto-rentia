
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Definición estricta de roles según arquitectura
export type UserRole = 'owner' | 'tenant' | 'broker' | 'agency' | 'staff' | 'worker' | null;

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole;
  loading: boolean;
  isSimulated: boolean; // Nuevo flag para saber si es login maestro
  logout: () => Promise<void>;
  simulateLogin: (role: UserRole, customData?: { uid: string, email: string, displayName: string }) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Si estamos en modo simulado, no dejar que el listener de Auth real lo sobrescriba inmediatamente
      if (isSimulated) {
          setLoading(false);
          return;
      }

      setLoading(true);

      if (user) {
        try {
          // Lectura estricta: Colección 'users', Documento ID = UID
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // SEGURIDAD: Verificar si el usuario está activo
            if (userData.active === false) {
                console.warn('Usuario desactivado intentando acceder. Cerrando sesión.');
                await signOut(auth);
                setCurrentUser(null);
                setUserRole(null);
                setLoading(false);
                return;
            }

            // Asignamos el rol desde el campo 'role'
            setUserRole(userData.role as UserRole);
            setCurrentUser(user);
          } else {
            // Usuario en Auth pero no en DB (Inconsistencia de seguridad)
            console.warn('Usuario autenticado sin perfil en Firestore (users collection). Cerrando sesión.');
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error obteniendo rol del usuario:", error);
          setUserRole(null);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isSimulated]);

  const logout = async () => {
    if (isSimulated) {
        setIsSimulated(false);
        setUserRole(null);
        setCurrentUser(null);
    } else {
        await signOut(auth);
        setUserRole(null);
        setCurrentUser(null);
    }
    window.location.hash = '#/';
  };

  // Función login simulado (o Maestro)
  const simulateLogin = (role: UserRole, customData?: { uid: string, email: string, displayName: string }) => {
    setIsSimulated(true);
    setUserRole(role);
    
    // Creamos un objeto similar a User de Firebase
    const fakeUser = { 
        email: customData?.email || `demo.${role}@rentiaroom.com`, 
        uid: customData?.uid || 'demo-uid',
        displayName: customData?.displayName || 'Usuario Simulado',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'fake-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'custom'
    } as unknown as User;

    setCurrentUser(fakeUser); 
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading, isSimulated, logout, simulateLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
