import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  databaseURL: "https://asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "asep-smart-locker",
  storageBucket: "asep-smart-locker.appspot.com",
  messagingSenderId: "367345634567",
  appId: "1:367345634567:web:8674563456789"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const rtdb = getDatabase(app, firebaseConfig.databaseURL);
const auth = getAuth(app);

export { app, db, rtdb, auth };
