
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyCv5G788hEWYmgv-2n0SRl9d0geUHkC9ko",
  authDomain: "crm-rentiaroom.firebaseapp.com",
  projectId: "crm-rentiaroom",
  storageBucket: "crm-rentiaroom.firebasestorage.app",
  messagingSenderId: "539747978100",
  appId: "1:539747978100:web:c54cd8f9b5b545c26eba21"
};

const isServer = typeof window === 'undefined';

// 1. Inicializar App
const app = initializeApp(firebaseConfig);

// 2. Inicializar Auth
export const auth = getAuth(app);
auth.languageCode = 'es'; // Forzar emails en español
if (!isServer) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
}

// 3. Inicializar Firestore
export const db = isServer
  ? getFirestore(app)
  : initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1'); // Ajustado a España (europe-west1)
