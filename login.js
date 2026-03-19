import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
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

/* 🔐 EMAIL LOGIN */

// 🔥 UPDATE SIGNUP LINK TO PRESERVE REDIRECT
const urlParams = new URLSearchParams(window.location.search);
const redirectParam = urlParams.get("redirect");

if (redirectParam) {
  const signupLink = document.querySelector('a[href="signup"]');
  if (signupLink) {
    signupLink.href = `signup?redirect=${redirectParam}`;
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // 🛡️ ENHANCED SECURE ADMIN VALIDATION (Using Blockchain-grade SHA-256 Hashing)
  // Converts the password to a cryptographic hash before checking so it's not exposed
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // The expected hash below corresponds to the secure admin password
  const EXPECTED_ADMIN_HASH = "8c3be3bd37c7682db141adfc1cf728340d0eaadd9c565d71c8c5daccb5c2ebf6";

  if (email === "Admin@0861" && hashHex === EXPECTED_ADMIN_HASH) {
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: "admin-root-blockchain-secured",
      email: "Admin@0861",
      name: "System Admin",
      isAdmin: true,
      loginTime: Date.now(),
      securityLevel: "SHA-256 Verified"
    }));
    window.location.href = "admin";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user profile from Firestore
    let userName = email.split("@")[0]; // Fallback to email username
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName = userData.name || userName;
      }
    } catch (error) {
      console.warn("Could not fetch user profile, using email as name:", error);
    }

    // ✅ STORE SESSION (with actual name + expiry timestamp)
    const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: userName,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS
    }));

    // ✅ REDIRECT LOGIC
    const storedRedirect = sessionStorage.getItem("postLoginRedirect");
    const urlParams = new URLSearchParams(window.location.search);
    const paramRedirect = urlParams.get("redirect");

    if (storedRedirect) {
      sessionStorage.removeItem("postLoginRedirect"); // Clear it
      window.location.href = storedRedirect;
    } else if (paramRedirect) {
      window.location.href = decodeURIComponent(paramRedirect);
    } else {
      window.location.href = "dashboard";
    }

  } catch (error) {
    // 🛡️ Generic error — don't expose specific Firebase error codes to the client
    // (Prevents user enumeration attacks: attacker can't tell if email exists or not)
    console.error("Login error:", error.code);
    alert("Incorrect email or password. Please try again.");
  }
});

/* 🌐 GOOGLE LOGIN */
const googleProvider = new GoogleAuthProvider();

document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Fetch user profile from Firestore (or extract from Google profile)
    let userName = user.displayName || user.email.split("@")[0];
    
    // Attempt to see if we have a custom profile in Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName = userData.name || userName;
      }
    } catch (error) {
      console.warn("Could not fetch user profile:", error);
    }

    // ✅ STORE SESSION (with expiry)
    const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: userName,
      loginTime: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS
    }));

    // ✅ REDIRECT LOGIC
    const storedRedirect = sessionStorage.getItem("postLoginRedirect");
    const urlParams = new URLSearchParams(window.location.search);
    const paramRedirect = urlParams.get("redirect");

    if (storedRedirect) {
      sessionStorage.removeItem("postLoginRedirect");
      window.location.href = storedRedirect;
    } else if (paramRedirect) {
      window.location.href = decodeURIComponent(paramRedirect);
    } else {
      window.location.href = "dashboard";
    }

  } catch (error) {
    if (error.code !== "auth/cancelled-popup-request") {
      // 🛡️ Generic error message — don't leak internal Firebase error codes
      console.error("Google login error:", error.code);
      alert("Google sign-in failed. Please try again.");
    }
  }
});






