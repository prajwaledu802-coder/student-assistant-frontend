// public/assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_mtCDtxwdxEMXW_zC7BUWY0Rf3qxsrPI",
  authDomain: "student-assistant-ai-993d0.firebaseapp.com",
  projectId: "student-assistant-ai-993d0",
  storageBucket: "student-assistant-ai-993d0.firebasestorage.app",
  messagingSenderId: "356385894010",
  appId: "1:356385894010:web:d2a8a2dee6a7ea48acd5c3",
  measurementId: "G-PS197CG5YQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function logMessage(user, role, text) {
  try {
    if (!user) return;
    const col = collection(db, "users", user.uid, "messages");
    await addDoc(col, {
      role,
      text,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Firestore write error:", err);
  }
}

export { app, auth, db, logMessage };
