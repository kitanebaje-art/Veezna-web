import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  Firestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 1. Singleton Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Singleton Firestore Instance (Prevents "already initialized" HMR error)
let db: Firestore;

try {
  // Attempt to initialize with custom options on first load
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache(),
  });
} catch (e: any) {
  // On Next.js Fast Refresh / HMR re-evaluations, return the existing instance
  db = getFirestore(app);
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export { db };
export default app;

