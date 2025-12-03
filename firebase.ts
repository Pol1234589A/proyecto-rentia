import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Fix: Use 'firebase/compat/app' to address module resolution issues with initializeApp.
import firebase from "firebase/compat/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCv5G788hEWYmgv-2n0SRl9d0geUHkC9ko",
  authDomain: "crm-rentiaroom.firebaseapp.com",
  projectId: "crm-rentiaroom",
  storageBucket: "crm-rentiaroom.firebasestorage.app",
  messagingSenderId: "539747978100",
  appId: "1:539747978100:web:c54cd8f9b5b545c26eba21"
};

// Initialize Firebase
// Fix: Call initializeApp from the compat import.
const app = firebase.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);