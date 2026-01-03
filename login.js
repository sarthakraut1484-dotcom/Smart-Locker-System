import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 🔥 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  projectId: "asep-smart-locker",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // ✅ STORE SESSION (THIS WAS MISSING)
    sessionStorage.setItem("currentUser", JSON.stringify({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name: email.split("@")[0],
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
