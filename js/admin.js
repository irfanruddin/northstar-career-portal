let currentUser = null;

async function initAdmin() {
  currentUser = await requireLogin();

  if (!currentUser || currentUser.role !== "admin") {
    window.location.replace("../index.html");
    return;
  }

  await renderAdmin();
}

async function getAdminJobs() {
  const token = localStorage.getItem("career_token");

  const response = await fetch(apiUrl("/api/admin/jobs"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load jobs.");
  }

  const data = await response.json();
  return data.jobs;
}

async function getAdminApplications() {
  const token = localStorage.getItem("career_token");

  const response = await fetch(apiUrl("/api/admin/applications"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load applications.");
  }

  const data = await response.json();
  return data.applications;
}

async function renderAdmin() {
  try {
    const jobs = await getAdminJobs();
    const apps = await getAdminApplications();

    document.getElementById("adminJobs").textContent = jobs.length;
    document.getElementById("adminApplications").textContent = apps.length;

    document.getElementById("adminPending").textContent = apps.filter(
      (a) => a.status === "Pending",
    ).length;

    renderJobs(jobs);
    renderApplications(apps);
  } catch (error) {
    console.error("Admin loading error:", error);
    const message = document.getElementById("jobMessage");
    showMessage(
      message,
      "Unable to load admin data. Check that the backend is running and your account is an admin.",
    );
  }
}

// --------------------
// JOBS
// --------------------

function renderJobs(jobs) {
  const container = document.getElementById("adminJobsList");

  if (!jobs.length) {
    container.innerHTML = `
      <div class="empty-state">
        No jobs available.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="admin-table admin-jobs-table">

      <thead>
        <tr>
          <th>Job</th>
          <th>Company</th>
          <th>Location</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>

        ${jobs
          .map(
            (job) => `
          <tr>

            <td>
              <strong>${esc(job.title)}</strong>
            </td>

            <td>
              ${esc(job.company)}
            </td>

            <td>
              ${esc(job.location)}
            </td>

            <td>
              ${esc(job.type)}
            </td>

            <td>
              <button
                class="btn"
                data-edit-job="${job.id}"
              >
                Edit
              </button>

              <button
                class="btn"
                data-delete-job="${job.id}"
              >
                Delete
              </button>
            </td>

          </tr>
        `,
          )
          .join("")}

      </tbody>

    </table>
  `;

  // Edit buttons
  document.querySelectorAll("[data-edit-job]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = Number(button.dataset.editJob);
      editJob(jobId, jobs);
    });
  });

  // Delete buttons
  document.querySelectorAll("[data-delete-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      const jobId = Number(button.dataset.deleteJob);

      await deleteJob(jobId);
    });
  });
}

// --------------------
// EDIT JOB
// --------------------

let editingJobId = null;

function editJob(jobId, jobs) {
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return;
  }

  editingJobId = jobId;
  document.getElementById("editJobTitle").value = job.title || "";
  document.getElementById("editJobCompany").value = job.company || "";
  document.getElementById("editJobLocation").value = job.location || "";
  document.getElementById("editJobType").value = job.type || "Full time";
  document.getElementById("editJobSalary").value = job.salary || "";
  document.getElementById("editJobSkills").value = (job.skills || []).join(", ");
  document.getElementById("editJobDescription").value = job.description || "";
  document.getElementById("editJobMessage").textContent = "";
  document.getElementById("editJobModal").classList.add("show");
}

async function saveEditedJob(e) {
  e.preventDefault();

  const message = document.getElementById("editJobMessage");
  const title = document.getElementById("editJobTitle").value.trim();
  const company = document.getElementById("editJobCompany").value.trim();
  const location = document.getElementById("editJobLocation").value.trim();
  const type = document.getElementById("editJobType").value;
  const salary = document.getElementById("editJobSalary").value.trim();
  const skills = document.getElementById("editJobSkills").value.trim();
  const description = document.getElementById("editJobDescription").value.trim();

  if (!title || !company || !location || !type || !salary || !skills || !description) {
    showMessage(message, "Please fill in all job fields.");
    return;
  }

  const token = localStorage.getItem("career_token");

  try {
    const response = await fetch(
      apiUrl(`/api/admin/jobs/${editingJobId}`),
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          title,
          company,
          location,
          type,
          salary,

          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),

          description,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      await showAppNotice(data.message || "Unable to update job.");
      return;
    }

    document.getElementById("editJobModal").classList.remove("show");
    showMessage(
      document.getElementById("jobMessage"),
      "Job updated successfully.",
      "success",
    );

    await renderAdmin();
  } catch (error) {
    console.error("Edit job error:", error);

    await showAppNotice("Unable to update job.");
  }
}

// --------------------
// DELETE JOB
// --------------------

async function deleteJob(jobId) {
  const confirmed = await showAppConfirm("Are you sure you want to delete this job?", "Delete job?");

  if (!confirmed) {
    return;
  }

  const token = localStorage.getItem("career_token");

  try {
    const response = await fetch(
      apiUrl(`/api/admin/jobs/${jobId}`),
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      await showAppNotice(data.message || "Unable to delete job.");
      return;
    }

    await showAppNotice("Job deleted successfully.", "Job deleted");

    await renderAdmin();
  } catch (error) {
    console.error("Delete job error:", error);

    await showAppNotice("Unable to delete job.");
  }
}

// --------------------
// APPLICATIONS
// --------------------
function renderApplications(apps) {
  const applicationsList = document.getElementById("adminApplicationsList");

  applicationsList.innerHTML = apps.length
    ? `
        <table class="admin-table admin-applications-table">

          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Company</th>
              <th>Resume</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            ${apps
              .map(
                (a) => `
              <tr>

                <td>
                  ${esc(a.applicant_name)}
                  <br>
                  <small>
                    ${esc(a.applicant_email)}
                  </small>
                </td>

                <td>
                  ${esc(a.job_title)}
                </td>

                <td>
                  ${esc(a.company)}
                </td>

                <td>
                  ${
                    a.resume_name
                      ? `
                        <button
                          class="btn resume-btn"
                          data-id="${a.id}"
                        >
                          View Resume
                        </button>
                      `
                      : `
                        <span class="muted-text">
                          No resume
                        </span>
                      `
                  }
                </td>

                <td>
                  <select
                    class="status-select"
                    data-id="${a.id}"
                  >

                    ${[
                      "Pending",
                      "Under Review",
                      "Shortlisted",
                      "Interview",
                      "Selected",
                      "Rejected",
                    ]
                      .map(
                        (status) => `
                      <option
                        value="${esc(status)}"
                        ${status === a.status ? "selected" : ""}
                      >
                        ${esc(status)}
                      </option>
                    `,
                      )
                      .join("")}

                  </select>
                </td>

              </tr>
            `,
              )
              .join("")}

          </tbody>

        </table>
      `
    : `
        <div class="empty-state">
          No applications yet.
        </div>
      `;

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      await updateApplicationStatus(
        Number(e.target.dataset.id),
        e.target.value,
      );
    });
  });

  document.querySelectorAll(".resume-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const token = localStorage.getItem("career_token");
      const resumeWindow = window.open("about:blank", "_blank");

      if (!resumeWindow) {
        await showAppNotice("Please allow pop-ups to view resumes.");
        return;
      }

      try {
        const response = await fetch(
          apiUrl(`/api/admin/applications/${button.dataset.id}/resume`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const data = await response.json();
          resumeWindow.close();
          await showAppNotice(data.message || "Unable to open resume.");
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        resumeWindow.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
        console.error("Resume error:", error);
        resumeWindow.close();
          await showAppNotice(
            error.message || "Unable to open resume. Check the Railway deployment and upload storage.",
          );
      }
    });
  });
}

async function updateApplicationStatus(applicationId, status) {
  const token = localStorage.getItem("career_token");

  try {
    const response = await fetch(
      apiUrl(`/api/admin/applications/${applicationId}/status`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update status.");
    }

    await renderAdmin();
  } catch (error) {
    console.error("Status update error:", error);
    await showAppNotice(error.message);
  }
}

// --------------------
// ADD JOB
// --------------------

document.getElementById("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.getElementById("jobMessage");

  const token = localStorage.getItem("career_token");

  const job = {
    title: document.getElementById("jobTitle").value.trim(),

    company: document.getElementById("jobCompany").value.trim(),

    location: document.getElementById("jobLocation").value.trim(),

    type: document.getElementById("jobType").value,

    salary: document.getElementById("jobSalary").value.trim(),

    skills: document
      .getElementById("jobSkills")
      .value.split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),

    description: document.getElementById("jobDescription").value.trim(),
  };

  try {
    const response = await fetch(apiUrl("/api/admin/jobs"), {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(job),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(message, data.message || "Unable to add job.");

      return;
    }

    e.target.reset();

    showMessage(message, "Job added successfully.", "success");

    await renderAdmin();
  } catch (error) {
    console.error("Add job error:", error);

    showMessage(message, "Unable to add job.");
  }
});

// --------------------
// LOGOUT
// --------------------

document.getElementById("adminLogout").addEventListener("click", logout);

document.addEventListener("DOMContentLoaded", () => {
  const editJobForm = document.getElementById("editJobForm");
  const cancelEditJob = document.getElementById("cancelEditJob");

  if (!editJobForm || !cancelEditJob) return;

  editJobForm.addEventListener("submit", saveEditedJob);
  cancelEditJob.addEventListener("click", () => {
    document.getElementById("editJobModal").classList.remove("show");
  });
});

// START
initAdmin();

function updateAdminSidebar() {
  const links = document.querySelectorAll(".admin-sidebar nav a");

  links.forEach(link => {
    link.classList.remove("active");
  });

  const hash = window.location.hash;

  if (hash === "#manageJobs") {
    document
      .querySelector('.admin-sidebar nav a[href="#manageJobs"]')
      ?.classList.add("active");
  } else if (hash === "#manageApplications") {
    document
      .querySelector('.admin-sidebar nav a[href="#manageApplications"]')
      ?.classList.add("active");
  } else {
    document
      .querySelector('.admin-sidebar nav a[href="admin.html"]')
      ?.classList.add("active");
  }
}

window.addEventListener("hashchange", updateAdminSidebar);

updateAdminSidebar();
