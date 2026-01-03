import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 Firebase config (same everywhere)
const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  projectId: "asep-smart-locker",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 📝 Signup handler
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    sessionStorage.setItem("currentUser", JSON.stringify({
      name: email.split("@")[0],
      email: email,
      uid: user.uid
    }));

    alert("Account created successfully! Please login to continue.");

    const storedRedirect = sessionStorage.getItem("postLoginRedirect");
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get("redirect");

    if (storedRedirect) {
      // Don't clear it yet, let login.js handle it after they log in
      // actually, we redirect to login, so login.js will see it. 
      // We do NOT need to pass it in URL if it is in Session.
      window.location.href = "login.html";
    } else if (redirectParam) {
      window.location.href = `login.html?redirect=${redirectParam}`;
    } else {
      window.location.href = "login.html";
    }


  } catch (error) {
    alert(error.message);
  }
});
