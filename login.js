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

/* 🔐 EMAIL LOGIN */

// 🔥 UPDATE SIGNUP LINK TO PRESERVE REDIRECT
const urlParams = new URLSearchParams(window.location.search);
const redirectParam = urlParams.get("redirect");

if (redirectParam) {
  const signupLink = document.querySelector('a[href="signup.html"]');
  if (signupLink) {
    signupLink.href = `signup.html?redirect=${redirectParam}`;
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // 👑 HARDCODED ADMIN CHECK
    if (email === "Admin@0861" && password === "Admin@0861") {
      sessionStorage.setItem("adminUser", JSON.stringify({
        uid: "hardcoded-admin",
        email: "Admin@0861",
        loginTime: Date.now()
      }));
      window.location.href = "admin-dashboard.html";
      return;
    }

    // NORMAL USER FIREBASE CHECK
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
      window.location.href = "face1.html";
    }

  } catch (error) {
    alert("Login failed: " + error.message);
  }
});
