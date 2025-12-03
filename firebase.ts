import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCv5G788hEWYmgv-2n0SRl9d0geUHkC9ko",
  authDomain: "crm-rentiaroom.firebaseapp.com",
  projectId: "crm-rentiaroom",
  storageBucket: "crm-rentiaroom.firebasestorage.app",
  messagingSenderId: "539747978100",
  appId: "1:539747978100:web:c54cd8f9b5b545c26eba21"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);