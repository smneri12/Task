// src/firebase.js 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore SDK

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmXTP5Pa3IJ3va_6fbZ1kb-JPcGLPkGfA",
  authDomain: "noteis-eac3a.firebaseapp.com",
  projectId: "noteis-eac3a",
  storageBucket: "noteis-eac3a.firebasestorage.app",
  messagingSenderId: "254611425322",
  appId: "1:254611425322:web:6c6d2d386241f86eb19b53",
  measurementId: "G-BPN0PH5VKZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app); 