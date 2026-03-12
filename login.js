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
  authDomain: "asep-LocknLeave.firebaseapp.com",
  projectId: "asep-LocknLeave",
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
    signupLink.href = `signup.html?redirect=${redirectParam}`;
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // 🛡️ ADMIN BYPASS
  if (email === "Admin@0861" && password === "Admin@0861") {
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: "admin-root",
      email: "Admin@0861",
      name: "System Admin",
      isAdmin: true,
      loginTime: Date.now()
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

    // ✅ STORE SESSION (with actual name)
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: userName,
      loginTime: Date.now()
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
      window.location.href = "face1";
    }

  } catch (error) {
    alert("Login failed: " + error.message);
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

    // ✅ STORE SESSION
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: userName,
      loginTime: Date.now()
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
      window.location.href = "face1";
    }

  } catch (error) {
    if (error.code !== "auth/cancelled-popup-request") {
      alert("Google sign-in failed: " + error.message);
    }
  }
});



