import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyANoo7ZFB2lZ7iivTxg1KqM61uNL9nA1KY",
    authDomain: "watchapp-37f12.firebaseapp.com",
    projectId: "watchapp-37f12",
    storageBucket: "watchapp-37f12.firebasestorage.app",
    messagingSenderId: "444768482846",
    appId: "1:444768482846:web:420ed9ed0f38543fb1600f",
    measurementId: "G-MFV592E5BH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
