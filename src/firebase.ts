import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCbeCsr7BqdlrHpO_PblYx9Xw6l01dF91Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0464376280.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0464376280",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0464376280.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "822407791749",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:822407791749:web:4c799266706b1d412395ec",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-bc0439a8-b0a1-4f9f-8819-58446dbe7a78";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);
