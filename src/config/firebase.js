// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDvuI04rlJqIQ2zjLoiUI7SBTDF1-Up3kQ",
  authDomain: "alyssa-app-459719.firebaseapp.com",
  projectId: "alyssa-app-459719",
  storageBucket: "alyssa-app-459719.firebasestorage.app",
  messagingSenderId: "98717045443",
  appId: "1:98717045443:web:8fbe2bcfb76dacc2ce0876",
  measurementId: "G-S9J6G4TPBH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider, db, storage };
