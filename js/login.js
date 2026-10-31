const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginPassword = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");
const loginNotice = document.getElementById("loginNotice");
const registerLink = document.getElementById("registerLink");

// Where to go after signing in (only a page inside the pages folder is accepted)
const nextTarget = safeNextTarget(new URLSearchParams(window.location.search).get("next"));

function destinationFor(user) {
  if (user.role === "admin") return "admin.html";
  return nextTarget && nextTarget !== "admin.html" ? nextTarget : "dashboard.html";
}

function showLoginNotice() {
  let notice = "";

  try {
    notice = sessionStorage.getItem("career_login_notice") || "";
    sessionStorage.removeItem("career_login_notice");
  } catch (error) {
    notice = "";
  }

  if (!notice && nextTarget.startsWith("apply.html")) {
    notice = "Sign in to apply for this job. You will come straight back to it.";
  }

  if (loginNotice) loginNotice.textContent = notice;
}

showLoginNotice();

if (registerLink && nextTarget) {
  registerLink.href = "register.html?next=" + encodeURIComponent(nextTarget);
}

async function redirectAuthenticatedUser() {
  if (!localStorage.getItem("career_token")) return;

  const user = await getCurrentUserFromAPI();

  if (user) {
    window.location.replace(destinationFor(user));
  }
}

redirectAuthenticatedUser();
window.addEventListener("pageshow", redirectAuthenticatedUser);

togglePassword.addEventListener("click", () => {
  const isVisible = loginPassword.type === "text";

  loginPassword.type = isVisible ? "password" : "text";
  togglePassword.textContent = isVisible ? "Show" : "Hide";
  togglePassword.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password`);
  togglePassword.setAttribute("aria-pressed", String(!isVisible));
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = loginPassword.value;

  if (!email || !password) {
    showMessage(loginMessage, "Email and password are required.");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage(loginMessage, "Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(loginMessage, data.message || "Unable to sign in.");
      return;
    }

    // Store only the authentication token
    localStorage.setItem("career_token", data.token);

    window.location.href = destinationFor(data.user);
  } catch (error) {
    console.error("Login error:", error);

    showMessage(
      loginMessage,
      "Unable to connect to the server. Please check your connection and try again.",
    );
  }
});
