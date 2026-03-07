document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = "Authenticating...";

    if (username === "Admin@0861" && password === "Admin@0861") {
      // Store admin session
      sessionStorage.setItem("adminUser", JSON.stringify({
        uid: "hardcoded-admin",
        email: "Admin@0861",
        loginTime: Date.now()
      }));

      // Redirect to Admin Dashboard
      window.location.href = "admin-dashboard.html";
    } else {
      alert("Invalid Admin Credentials.");
    }
  } catch (error) {
    alert("Admin Login failed: " + error.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Secure Login";
  }
});
