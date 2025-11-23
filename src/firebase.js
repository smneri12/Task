// src/firebase.js 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore SDK

const firebaseConfig = {

    apiKey: "AIzaSyCe4MGx0mLCR03VQz3VRY7SrfrRxbIyPV0",
    authDomain: "noteis.firebaseapp.com",
    projectId: "noteis",
    storageBucket: "noteis.firebasestorage.app",
    messagingSenderId: "349845936804",
    appId: "1:349845936804:web:890f217d54607666a8e431",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 