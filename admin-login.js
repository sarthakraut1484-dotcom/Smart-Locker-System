import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  projectId: "asep-smart-locker",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = "Authenticating...";

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Optional: We can verify if this user is actually an admin from Firestore
    // For now, we allow login and redirect to the dashboard.
    // In a real production system, you'd check a "role" field in Firestore for admin access.
    
    // Store admin session
    sessionStorage.setItem("adminUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      loginTime: Date.now()
    }));

    // Redirect to Admin Dashboard
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    alert("Admin Login failed: " + error.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Secure Login";
  }
});
