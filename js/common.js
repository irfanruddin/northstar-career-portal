
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
    showAppNotice("Logout confirmation is not available on this page.");
    return;
  }

  modal.classList.add("show");
}

function getAppModal() {
  let modal = document.getElementById("appMessageModal");

  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "appMessageModal";
  modal.className = "logout-modal";
  modal.innerHTML = `
    <div class="logout-dialog app-message-dialog">
      <div class="logout-icon" id="appMessageIcon">!</div>
      <h2 id="appMessageTitle">Notice</h2>
      <p id="appMessageText"></p>
      <div class="logout-actions">
        <button class="logout-cancel" id="appMessageCancel" type="button">Cancel</button>
        <button class="logout-confirm" id="appMessageConfirm" type="button">Okay</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function showAppNotice(text, title = "Notice") {
  const modal = getAppModal();
  modal.querySelector("#appMessageTitle").textContent = title;
  modal.querySelector("#appMessageText").textContent = text;
  modal.querySelector("#appMessageIcon").textContent = "!";
  modal.querySelector("#appMessageCancel").hidden = true;
  modal.classList.add("show");

  return new Promise((resolve) => {
    const close = () => {
      modal.classList.remove("show");
      modal.querySelector("#appMessageConfirm").removeEventListener("click", close);
      resolve();
    };
    modal.querySelector("#appMessageConfirm").addEventListener("click", close);
  });
}

function showAppConfirm(text, title = "Please confirm") {
  const modal = getAppModal();
  modal.querySelector("#appMessageTitle").textContent = title;
  modal.querySelector("#appMessageText").textContent = text;
  modal.querySelector("#appMessageIcon").textContent = "?";
  modal.querySelector("#appMessageCancel").hidden = false;
  modal.classList.add("show");

  return new Promise((resolve) => {
    const cancel = () => finish(false);
    const confirm = () => finish(true);
    const finish = (result) => {
      modal.classList.remove("show");
      modal.querySelector("#appMessageCancel").removeEventListener("click", cancel);
      modal.querySelector("#appMessageConfirm").removeEventListener("click", confirm);
      resolve(result);
    };
    modal.querySelector("#appMessageCancel").addEventListener("click", cancel);
    modal.querySelector("#appMessageConfirm").addEventListener("click", confirm);
  });
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
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const baseUrl = isLocal
    ? `http://${window.location.hostname}:5000`
    : "https://northstar-career-portal-production.up.railway.app";

  return `${baseUrl}${path}`;
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