"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Definición estricta de roles según arquitectura
export type UserRole = 'owner' | 'tenant' | 'broker' | 'agency' | 'staff' | 'worker' | 'manager' | null;

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
            // Usuario en Auth pero no en DB (Inconsistencia de seguridad o error de creación)
            console.warn('Usuario autenticado sin perfil en Firestore. Cerrando sesión por seguridad.');
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
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUserRole(null);
    setCurrentUser(null);
    window.location.hash = '#/';
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
