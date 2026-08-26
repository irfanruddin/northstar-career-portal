const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginPassword = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");

async function redirectAuthenticatedUser() {
  if (!localStorage.getItem("career_token")) return;

  const user = await getCurrentUserFromAPI();

  if (user) {
    window.location.replace(
      user.role === "admin" ? "pages/admin.html" : "pages/dashboard.html",
    );
  }
}

redirectAuthenticatedUser();
window.addEventListener("pageshow", redirectAuthenticatedUser);

function clearAutofilledCredentials() {
  document.getElementById("loginEmail").value = "";
  loginPassword.value = "";
  loginPassword.type = "password";

  togglePassword.textContent = "Show";
  togglePassword.setAttribute("aria-label", "Show password");
  togglePassword.setAttribute("aria-pressed", "false");
}

window.addEventListener("pageshow", clearAutofilledCredentials);
window.setTimeout(clearAutofilledCredentials, 300);

togglePassword.addEventListener("click", () => {
  const isVisible = loginPassword.type === "text";

  loginPassword.type = isVisible ? "password" : "text";
  togglePassword.textContent = isVisible ? "Show" : "Hide";

  togglePassword.setAttribute(
    "aria-label",
    `${isVisible ? "Show" : "Hide"} password`
  );

  togglePassword.setAttribute(
    "aria-pressed",
    String(!isVisible)
  );
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document
    .getElementById("loginEmail")
    .value
    .trim()
    .toLowerCase();

  const password = loginPassword.value;

  if (!email || !password) {
    showMessage(
      loginMessage,
      "Email and password are required."
    );
    return;
  }

  if (!isValidEmail(email)) {
    showMessage(loginMessage, "Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(
      apiUrl("/api/auth/login"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage(
        loginMessage,
        data.message || "Unable to sign in."
      );
      return;
    }

    // Store only the authentication information
    localStorage.setItem(
      "career_token",
      data.token
    );

    // localStorage.setItem(
    //   "career_current_user",
    //   data.user.email
    // );

    // Redirect according to backend role
    window.location.href =
      data.user.role === "admin"
        ? "pages/admin.html"
        : "pages/dashboard.html";

  } catch (error) {
    console.error("Login error:", error);

    showMessage(
      loginMessage,
      "Unable to connect to the server. Make sure the backend is running."
    );
  }
});

document
  .getElementById("forgotPassword")
  .addEventListener("click", (e) => {
    e.preventDefault();

    showMessage(
      loginMessage,
      "Password recovery will be connected to the backend later.",
      "success"
    );
  });