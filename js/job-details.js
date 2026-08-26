requireLogin();

const id = Number(new URLSearchParams(location.search).get("id"));
const root = document.getElementById("jobDetails");

async function loadJobDetails() {
  if (!id) {
    root.innerHTML = `<div class="empty-state">Invalid job.</div>`;
    return;
  }

  try {
    const response = await fetch(
      apiUrl(`/api/jobs/${id}`)
    );

    if (!response.ok) {
      root.innerHTML = `<div class="empty-state">Job not found.</div>`;
      return;
    }

    const data = await response.json();
    const job = data.job;

    root.innerHTML = `
      <span class="tag">${esc(job.type)}</span>

      <h1>${esc(job.title)}</h1>

      <p class="detail-company">
        ${esc(job.company)} ·
        ${esc(job.location)} ·
        ${esc(job.salary)}
      </p>

      <div class="detail-section">
        <h2>About the role</h2>
        <p>${esc(job.description)}</p>
      </div>

      <div class="detail-section">
        <h2>Skills</h2>

        <div class="detail-skills">
          ${job.skills.map(s =>
            `<span class="skill">${esc(s)}</span>`
          ).join("")}
        </div>
      </div>

      <div class="detail-section">
        <a class="btn" href="apply.html?id=${job.id}">
          Apply now →
        </a>
      </div>
    `;

  } catch (error) {
    console.error("Error loading job:", error);

    root.innerHTML = `
      <div class="empty-state">
        Unable to load job details.
      </div>
    `;
  }
}

loadJobDetails();