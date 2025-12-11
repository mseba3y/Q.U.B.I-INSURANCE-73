import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// إعدادات مشروع Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCuRfIK7fVlL5NptRm9NATs8a6denXJ4Z8",
  authDomain: "qubiinsurance73.firebaseapp.com",
  projectId: "qubiinsurance73",
  storageBucket: "qubiinsurance73.firebasestorage.app",
  messagingSenderId: "859059365584",
  appId: "1:859059365584:web:b74acb7434bffc45c5a0d5",
  measurementId: "G-4ZJBYVQKJ0"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة Firestore
export const db = getFirestore(app);
