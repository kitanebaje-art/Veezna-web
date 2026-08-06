import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
apiKey: "AIzaSyCwlEH-JNxNn7tl1eSsb3kMgWwDPp-Mwbc",
  authDomain: "veezna-web.firebaseapp.com",
  projectId: "veezna-web",
  storageBucket: "veezna-web.firebasestorage.app",
  messagingSenderId: "446609485672",
  appId: "1:446609485672:web:7fae22287643b06fae70dd",
  measurementId: "G-XXKBTNEL23"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);