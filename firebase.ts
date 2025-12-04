
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCv5G788hEWYmgv-2n0SRl9d0geUHkC9ko",
  authDomain: "crm-rentiaroom.firebaseapp.com",
  projectId: "crm-rentiaroom",
  storageBucket: "crm-rentiaroom.firebasestorage.app",
  messagingSenderId: "539747978100",
  appId: "1:539747978100:web:c54cd8f9b5b545c26eba21"
};

// 1. Inicializar App
const app = initializeApp(firebaseConfig);

// 2. Inicializar Auth con persistencia Local (sobrevive al cierre del navegador)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// 3. Inicializar Firestore con caché persistente (Offline support)
// Usamos initializeFirestore para configuración avanzada en lugar de getFirestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Habilitar persistencia explícita para navegadores antiguos si es necesario, 
// aunque initializeFirestore ya lo maneja arriba.
// (El bloque try-catch es preventivo por si el navegador no soporta IndexedDB)
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistencia fallida: Múltiples pestañas abiertas.');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistencia no soportada por el navegador.');
    }
  });
} catch (e) {
  // Ignorar si ya está inicializado
}

export const storage = getStorage(app);
