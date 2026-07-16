import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (with databaseId custom setting if provided)
export const db = initializeFirestore(app, {
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

// Initialize Storage
export const storage = getStorage(app);
