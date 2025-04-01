import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC12W_1XZflD5iJJvxejpzs7cVJsbvYkT0",
  authDomain: "guild-hackathon.firebaseapp.com",
  projectId: "guild-hackathon",
  storageBucket: "guild-hackathon.appspot.com",
  messagingSenderId: "636384677322",
  appId: "1:636384677322:web:2baba52069029f81c21333",
  measurementId: "G-HQ6PN9PEKK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);