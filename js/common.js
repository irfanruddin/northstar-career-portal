async function getCurrentUser() {
  return await getCurrentUserFromAPI();
}

async function requireLogin() {
  const hadToken = Boolean(localStorage.getItem("career_token"));
  const user = await getCurrentUserFromAPI();

  if (!user) {
    const issue = window.lastAuthIssue;

    if (hadToken && issue === "expired") {
      localStorage.removeItem("career_token");
      localStorage.removeItem("career_current_user");
    }

    const notice = !hadToken
      ? "Please sign in to continue."
      : issue === "expired"
        ? "Your session has ended. Please sign in again."
        : "We could not reach the server. Please try again.";

    try {
      sessionStorage.setItem("career_login_notice", notice);
    } catch (error) {
      /* ignore */
    }

    window.location.replace(loginUrl(currentPageAsNext()));
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
      modal
        .querySelector("#appMessageConfirm")
        .removeEventListener("click", close);
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
      modal
        .querySelector("#appMessageCancel")
        .removeEventListener("click", cancel);
      modal
        .querySelector("#appMessageConfirm")
        .removeEventListener("click", confirm);
      resolve(result);
    };
    modal.querySelector("#appMessageCancel").addEventListener("click", cancel);
    modal
      .querySelector("#appMessageConfirm")
      .addEventListener("click", confirm);
  });
}

function performLogout() {
  localStorage.removeItem("career_token");
  localStorage.removeItem("career_current_user");

  window.location.replace(siteUrl("pages/home.html"));
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
    mobileMenuBtn.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu",
    );
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

  const form = el.closest ? el.closest("form") : null;

  if (form) {
    form.querySelectorAll("button[data-loading]").forEach((button) => {
      setTimeout(
        () => setButtonLoading(button, false),
        type === "success" ? 1200 : 0,
      );
    });
  }
}

function isValidEmail(email) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
    email,
  );
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
  window.lastAuthIssue = null;

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
      window.lastAuthIssue = [401, 403].includes(response.status)
        ? "expired"
        : "network";
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Unable to fetch current user:", error);
    window.lastAuthIssue = "network";
    return null;
  }
}

window.addEventListener("pageshow", async (event) => {
  if (!event.persisted || !document.querySelector(".app-shell")) return;

  const user = await getCurrentUserFromAPI();

  if (!user) {
    window.location.replace(loginUrl(currentPageAsNext()));
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

/* ---------- Shared helpers (links, status colours, loading buttons, public header) ---------- */

const IN_PAGES = window.location.pathname.includes("/pages/");

function siteUrl(path) {
  return (IN_PAGES ? "../" : "") + path;
}

function loginUrl(next) {
  const base = siteUrl("pages/login.html");
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

function currentPageAsNext() {
  return window.location.pathname.split("/").pop() + window.location.search;
}

// Accepts only a page inside the pages folder, such as apply.html?id=5
function safeNextTarget(raw) {
  const value = String(raw || "");
  const looksSafe = /^[a-z0-9-]+\.html(\?[A-Za-z0-9=&_-]*)?$/.test(value);
  const isAuthPage = /^(login|register)\.html/.test(value);
  return looksSafe && !isAuthPage ? value : "";
}

function statusClass(status) {
  const classes = {
    Pending: "is-pending",
    "Under Review": "is-review",
    Shortlisted: "is-shortlisted",
    Interview: "is-interview",
    Selected: "is-hired",
    Rejected: "is-rejected",
  };
  return classes[status] || "";
}

function resumeExtension(mimeType) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "application/msword") return ".doc";
  if (mimeType && mimeType.includes("wordprocessingml")) return ".docx";
  return "";
}

function setButtonLoading(button, loading) {
  if (!button) return;

  if (loading) {
    if (button.dataset.loading) return;
    button.dataset.loading = "1";
    button.dataset.label = button.textContent;
    button.textContent = "Please wait…";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    // Safety net: never leave a button stuck if a page forgets to reset it
    setTimeout(() => setButtonLoading(button, false), 10000);
  } else if (button.dataset.loading) {
    delete button.dataset.loading;
    button.textContent = button.dataset.label;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

// Stops double submits on every form
document.addEventListener(
  "submit",
  (event) => {
    const form = event.target;
    const button = form.querySelector(
      'button[type="submit"], button:not([type])',
    );

    if (!button || form.hasAttribute("data-no-loading")) return;

    if (button.dataset.loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (form.checkValidity()) setButtonLoading(button, true);
  },
  true,
);

// Escape closes any open dialog
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  document.querySelectorAll(".logout-modal.show").forEach((modal) => {
    const closer = modal.querySelector(
      '.logout-cancel:not([hidden]), button[id*="ancel"], button[id*="lose"], #appMessageConfirm',
    );
    if (closer) closer.click();
  });
});

// Public header: mobile menu, and Dashboard link when signed in
async function setupPublicNav() {
  const menuButton = document.getElementById("publicMenuBtn");
  const nav = document.getElementById("publicNav");
  const actions = document.getElementById("siteNavActions");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.textContent = isOpen ? "✕" : "☰";
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
      );
    });
  }

  if (!actions || !localStorage.getItem("career_token")) return;

  const user = await getCurrentUserFromAPI();
  if (!user) return;

  const isAdmin = user.role === "admin";
  const cta = document.getElementById("homeCta");
  if (cta) cta.remove();
  actions.innerHTML = `<a class="btn" href="${siteUrl(isAdmin ? "pages/admin.html" : "pages/dashboard.html")}">${isAdmin ? "Admin panel" : "Dashboard"}</a>`;
}

document.addEventListener("DOMContentLoaded", setupPublicNav);

/* ---------- Job list helpers (used by the home page and the candidate jobs page) ---------- */

function normaliseJobs(jobs) {
  return jobs.map((job) => ({
    ...job,
    skills: job.skills
      ? String(job.skills)
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [],
  }));
}

function jobMeta(job) {
  return [job.location, job.salary].filter(Boolean).map(esc).join(" · ");
}

function jobCardHtml(job) {
  return `
    <article class="job-card">
      <span class="tag">${esc(job.type)}</span>
      <h2>${esc(job.title)}</h2>
      <div class="company">${esc(job.company)}</div>
      <div class="meta">${jobMeta(job)}</div>
      <div class="skills">${job.skills.map((skill) => esc(skill)).join(" · ")}</div>
      <a class="btn" href="${siteUrl("pages/job-details.html")}?id=${encodeURIComponent(job.id)}">View details →</a>
    </article>`;
}

// Keeps the first "All ..." option and fills the rest from the values found in the jobs
function fillSelect(select, values) {
  if (!select) return;

  const current = select.value;
  const unique = [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  while (select.options.length > 1) select.remove(1);

  unique.forEach((value) => select.add(new Option(value, value)));

  if (unique.includes(current)) select.value = current;
}
