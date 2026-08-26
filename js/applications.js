requireLogin();

const container = document.getElementById("applicationsContainer");

async function loadApplications() {
  try {
    const token = localStorage.getItem("career_token");

    const response = await fetch(
      apiUrl("/api/applications/my"),
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load applications.");
    }

    const apps = data.applications;

    container.innerHTML = apps.length
      ? apps.map(a => `
          <article class="application-card">
            <div>
              <h3>${esc(a.job_title)}</h3>
              <p>
                ${esc(a.company)} ·
                Applied ${new Date(a.applied_at).toLocaleDateString()}
              </p>
            </div>

            <span class="status">
              ${esc(a.status)}
            </span>
          </article>
        `).join("")
      : `
          <div class="panel empty-state">
            You haven't applied to any jobs yet.
          </div>
        `;

  } catch (error) {
    console.error("Error loading applications:", error);

    container.innerHTML = `
      <div class="panel empty-state">
        Unable to load your applications.
      </div>
    `;
  }
}

loadApplications();