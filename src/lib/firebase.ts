import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const metaEnv = (import.meta as any).env || {};

// Load configuration from env variables with standard fallback values from firebase-applet-config.json
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyCkvTND2PqMXGkiobPUUe3ElNjSS9bXl0k",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0124365711.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0124365711",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0124365711.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "1048662915750",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:1048662915750:web:40ce4f0da8cfa9f36dd267"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use the explicit firestore databaseId requested by the platform configuration
export const db = getFirestore(app, "ai-studio-savanijaswanthpo-e5033398-54b7-47ce-9348-58689c9665d2");

export const storage = getStorage(app);

