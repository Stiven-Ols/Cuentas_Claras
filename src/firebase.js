import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TUS CREDENCIALES REALES
const firebaseConfig = {
  apiKey: "AIzaSyA-CPPHnP3c5BzVSCFlJO5FvGGaKearoE8",
  authDomain: "cuentas-claras-4bba4.firebaseapp.com",
  projectId: "cuentas-claras-4bba4",
  storageBucket: "cuentas-claras-4bba4.firebasestorage.app",
  messagingSenderId: "496676277274",
  appId: "1:496676277274:web:ed6ae7961cd7d1ab2115a3",
  measurementId: "G-3RZVJ69TL0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
