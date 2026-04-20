import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBU6bTWgoj2Jt-MTkOw1W-Q2FMv3HVNICQ",
  authDomain: "itccyearbooktrack-2026.firebaseapp.com",
  databaseURL: "https://itccyearbooktrack-2026-default-rtdb.firebaseio.com",
  projectId: "itccyearbooktrack-2026",
  storageBucket: "itccyearbooktrack-2026.firebasestorage.app",
  messagingSenderId: "860606917645",
  appId: "1:860606917645:web:de3c366ccf28cf75603944",
  measurementId: "G-JR7BEX75DY",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
