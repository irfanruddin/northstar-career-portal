
async function getCurrentUser() {
  return await getCurrentUserFromAPI();
}

async function requireLogin() {
  const user = await getCurrentUserFromAPI();

  if (!user) {
    window.location.replace("../index.html");
    return null;
  }

  return user;
}

function logout() {
  const modal = document.getElementById("logoutModal");

  if (!modal) {
    alert("Logout confirmation is not available on this page.");
    return;
  }

  modal.classList.add("show");
}

function performLogout() {
  localStorage.removeItem("career_token");
  localStorage.removeItem("career_current_user");

  window.location.replace("../index.html");
}

document
  .querySelectorAll("#logoutBtn")
  .forEach((btn) => btn.addEventListener("click", logout));

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");

if (mobileMenuBtn && sidebar) {
  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("mobile-open");

    mobileMenuBtn.textContent = isOpen ? "✕" : "☰";
    mobileMenuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  sidebar.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      mobileMenuBtn.textContent = "☰";
      mobileMenuBtn.setAttribute("aria-label", "Open menu");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

function showMessage(el, text, type = "error") {
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add("form-message", type);
}

function isValidEmail(email) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email);
}

function isValidPhone(phone) {
  return /^[+]?[0-9\s-]{10,15}$/.test(phone);
}

function apiUrl(path) {
  const host = window.location.hostname || "localhost";
  return `http://${host}:5000${path}`;
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
async function getCurrentUserFromAPI() {
  const token = localStorage.getItem("career_token");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(apiUrl("/api/auth/me"), {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Unable to fetch current user:", error);
    return null;
  }
}

window.addEventListener("pageshow", async (event) => {
  if (!event.persisted || !document.querySelector(".app-shell")) return;

  const user = await getCurrentUserFromAPI();

  if (!user) {
    window.location.replace("../index.html");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("logoutModal");
  const cancelBtn = document.getElementById("cancelLogout");
  const confirmBtn = document.getElementById("confirmLogout");

  if (!modal) return;

  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  confirmBtn.addEventListener("click", () => {
    performLogout();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});