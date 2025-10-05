// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB8EsaKswi7GWNAwoCKzGz-AoqHJvhxkPg",
  authDomain: "causalforecastingandsimulation.firebaseapp.com",
  databaseURL: "https://causalforecastingandsimulation-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "causalforecastingandsimulation",
  storageBucket: "causalforecastingandsimulation.firebasestorage.app",
  messagingSenderId: "122718874795",
  appId: "1:122718874795:web:e2446fb240a0c01e155bee",
  measurementId: "G-72DNFS2RJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore instead of Realtime Database
export const realtimeDb = getDatabase(app); // Keep this if you still need Realtime Database