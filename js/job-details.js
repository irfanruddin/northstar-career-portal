// Public job details: anyone can read a job. Only applying needs an account.
const id = Number(new URLSearchParams(location.search).get("id"));
const root = document.getElementById("jobDetails");

async function loadJobDetails() {
  if (!id) {
    root.innerHTML = `<div class="empty-state">Invalid job.</div>`;
    return;
  }

  try {
    const response = await fetch(apiUrl(`/api/jobs/${id}`));

    if (!response.ok) {
      root.innerHTML = `<div class="empty-state">Job not found.</div>`;
      return;
    }

    const data = await response.json();
    const job = data.job;
    const skills = Array.isArray(job.skills)
      ? job.skills
      : String(job.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean);

    // Signed-out visitors go to sign-in first, then come straight back to the application
    const applyTarget = `apply.html?id=${job.id}`;
    const applyHref = localStorage.getItem("career_token") ? applyTarget : loginUrl(applyTarget);

    document.title = `${job.title} at ${job.company} · Northstar Careers`;

    root.innerHTML = `
      <span class="tag">${esc(job.type)}</span>

      <h1>${esc(job.title)}</h1>

      <p class="detail-company">
        ${[job.company, job.location, job.salary].filter(Boolean).map(esc).join(" · ")}
      </p>

      <div class="detail-actions">
        <a class="btn" href="${applyHref}">Apply now →</a>
      </div>

      <div class="detail-section">
        <h2>About the role</h2>
        <p>${esc(job.description)}</p>
      </div>

      <div class="detail-section">
        <h2>Skills</h2>

        <div class="detail-skills">
          ${skills.map((skill) => `<span class="skill">${esc(skill)}</span>`).join("")}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading job:", error);

    root.innerHTML = `
      <div class="empty-state">
        Unable to load job details. Please try again.
      </div>
    `;
  }
}

loadJobDetails();
