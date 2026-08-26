(async function () {
  const user = await getCurrentUserFromAPI();

  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  const token = localStorage.getItem("career_token");

  try {
    // Get jobs from MySQL
    const jobsResponse = await fetch(
      apiUrl("/api/jobs")
    );

    if (!jobsResponse.ok) {
      throw new Error("Unable to load jobs.");
    }

    const jobsData = await jobsResponse.json();
    const jobs = jobsData.jobs.map(job => ({
      ...job,
      skills: job.skills
        ? job.skills
            .split(",")
            .map(skill => skill.trim())
        : []
    }));


    // Get current user's applications from MySQL
    const applicationsResponse = await fetch(
      apiUrl("/api/applications/my"),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!applicationsResponse.ok) {
      throw new Error("Unable to load applications.");
    }

    const applicationsData =
      await applicationsResponse.json();

    const apps = applicationsData.applications;


    // Welcome section
    document.getElementById("welcomeTitle").textContent =
      `Welcome back, ${user.name.split(" ")[0]}.`;

    document.getElementById("avatarInitial").textContent =
      user.name.charAt(0).toUpperCase();


    // Statistics
    document.getElementById("statApplications").textContent =
      apps.length;

    document.getElementById("statReview").textContent =
      apps.filter(a =>
        ["Pending", "Under Review"].includes(a.status)
      ).length;

    document.getElementById("statShortlisted").textContent =
      apps.filter(a =>
        ["Shortlisted", "Interview", "Selected"]
          .includes(a.status)
      ).length;


    // Recommended jobs
    document.getElementById("recommendedJobs").innerHTML =
      jobs.slice(0, 3).map(job => `
        <div class="job-mini">
          <div>
            <h3>${esc(job.title)}</h3>

            <p>
              ${esc(job.company)} ·
              ${esc(job.location)}
            </p>
          </div>

          <a
            class="btn"
            href="job-details.html?id=${job.id}"
          >
            View
          </a>
        </div>
      `).join("");


    // Recent applications
    const recent =
      document.getElementById("recentApplications");

    recent.innerHTML = apps.length
      ? apps.slice(0, 4).map(a => `
          <div class="activity">

            <strong>
              ${esc(a.job_title)}
            </strong>

            <span>
              ${esc(a.status)} ·
              ${new Date(
                a.applied_at
              ).toLocaleDateString()}
            </span>

          </div>
        `).join("")
      : `
          <div class="empty-state">
            No applications yet.
            Explore the open roles.
          </div>
        `;

  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

    document.getElementById(
      "recommendedJobs"
    ).innerHTML = `
      <div class="empty-state">
        Unable to load recommended jobs.
      </div>
    `;

    document.getElementById(
      "recentApplications"
    ).innerHTML = `
      <div class="empty-state">
        Unable to load applications.
      </div>
    `;
  }

})();
