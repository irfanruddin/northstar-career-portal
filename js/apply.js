requireLogin();

const id = Number(new URLSearchParams(location.search).get("id"));

const form = document.getElementById("applicationForm");
const message = document.getElementById("applicationMessage");

let user = null;
let job = null;

async function loadApplicationPage() {
  try {
    // Get logged-in user from the backend
    user = await requireLogin();

    if (!user) {
      return;
    }

    // Get job from MySQL through the API
    const response = await fetch(apiUrl(`/api/jobs/${id}`));

    if (!response.ok) {
      throw new Error("Job not found");
    }

    const data = await response.json();
    job = data.job;

    // Display job information
    document.getElementById("applyTitle").textContent =
      `Apply for ${job.title}`;

    document.getElementById("applyCompany").textContent =
      `${job.company} · ${job.location}`;

    // Fill candidate information
    document.getElementById("appName").value = user.name || "";

    document.getElementById("appEmail").value = user.email || "";

    document.getElementById("appPhone").value = user.phone || "";

    document.getElementById("appEducation").value = user.education || "";

    document.getElementById("appSkills").value = user.skills || "";
  } catch (error) {
    console.error("Error loading application page:", error);

    message.textContent = "Unable to load application details.";
    form.style.display = "none";
    return;
  }

  // Handle application submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("appName").value.trim();
const email = document.getElementById("appEmail").value.trim();
const phone = document.getElementById("appPhone").value.trim();
const education = document.getElementById("appEducation").value.trim();
const skills = document.getElementById("appSkills").value.trim();

if (!name || !email || !phone || !education || !skills) {
  showMessage(message, "Please fill in all required fields.");
  return;
}

if (!isValidEmail(email)) {
  showMessage(message, "Please enter a valid email address.");
  return;
}

if (!isValidPhone(phone)) {
  showMessage(message, "Please enter a valid phone number.");
  return;
}

    try {
      const token = localStorage.getItem("career_token");

      const formData = new FormData();

formData.append("jobId", job.id);
formData.append(
  "name",
  document.getElementById("appName").value.trim()
);
formData.append(
  "email",
  document.getElementById("appEmail").value.trim()
);
formData.append(
  "phone",
  document.getElementById("appPhone").value.trim()
);
formData.append(
  "education",
  document.getElementById("appEducation").value.trim()
);
formData.append(
  "skills",
  document.getElementById("appSkills").value.trim()
);

const resumeFile = document.getElementById("appResume").files[0];

if (!resumeFile) {
  showMessage(message, "Please attach your resume.");
  return;
}

if (resumeFile) {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  const extension = resumeFile.name.toLowerCase().split(".").pop();
  const allowedExtensions = ["pdf", "doc", "docx"];

  if (!allowedTypes.includes(resumeFile.type) || !allowedExtensions.includes(extension)) {
    showMessage(message, "Resume must be a PDF, DOC, or DOCX file.");
    return;
  }

  if (resumeFile.size > 5 * 1024 * 1024) {
    showMessage(message, "Resume must be smaller than 5 MB.");
    return;
  }
}

if (resumeFile) {
  formData.append("resume", resumeFile);
}

const response = await fetch(
  apiUrl("/api/applications"),
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }
);

      const data = await response.json();

      if (!response.ok) {
        showMessage(message, data.message || "Unable to submit application.");
        return;
      }

      showMessage(
        message,
        data.message || "Application submitted successfully!",
        "success",
      );

      setTimeout(() => {
        location.href = "applications.html";
      }, 1000);
    } catch (error) {
      console.error("Application error:", error);

      showMessage(message, "Unable to submit application. Please try again.");
    }
  });
}

loadApplicationPage();
