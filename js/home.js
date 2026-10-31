// Public home page: anyone can browse jobs. Nothing here needs a login.
const container = document.getElementById("jobsContainer");
const search = document.getElementById("jobSearch");
const locationFilter = document.getElementById("locationFilter");
const typeFilter = document.getElementById("typeFilter");
const count = document.getElementById("jobCount");
const heroForm = document.getElementById("homeSearchForm");
const clearButton = document.getElementById("clearFilters");
const heroLocation = document.getElementById("heroLocation");
const heroJob = document.getElementById("heroJob");

let allJobs = [];

function renderHeroJob() {
  if (!heroJob || !allJobs.length) return;

  const latest = allJobs.reduce((a, b) =>
    Number(b.id) > Number(a.id) ? b : a,
  );

  heroJob.innerHTML = `
    <span class="tag">${esc(latest.type)}</span>
    <h2>${esc(latest.title)}</h2>
    <p>${esc(latest.company)}${latest.location ? " · " + esc(latest.location) : ""}</p>
    <a href="pages/job-details.html?id=${encodeURIComponent(latest.id)}">View details →</a>`;
  heroJob.classList.add("show");
}

async function loadJobs() {
  const cached = sessionStorage.getItem("career_jobs");
  if (cached) {
    try {
      allJobs = JSON.parse(cached);
      fillSelect(
        locationFilter,
        allJobs.map((job) => job.location),
      );
      fillSelect(
        heroLocation,
        allJobs.map((job) => job.location),
      );
      fillSelect(
        typeFilter,
        allJobs.map((job) => job.type),
      );
      renderJobs();
    } catch (error) {}
  }
  try {
    const response = await fetch(apiUrl("/api/jobs"));

    if (!response.ok) {
      throw new Error("Unable to fetch jobs");
    }

    const data = await response.json();

    allJobs = normaliseJobs(data.jobs);

    sessionStorage.setItem("career_jobs", JSON.stringify(allJobs));

    fillSelect(
      locationFilter,
      allJobs.map((job) => job.location),
    );
    fillSelect(
      heroLocation,
      allJobs.map((job) => job.location),
    );
    fillSelect(
      typeFilter,
      allJobs.map((job) => job.type),
    );

    renderHeroJob();
    renderJobs();
  } catch (error) {
    console.error("Error loading jobs:", error);

    container.innerHTML = `<div class="empty-state">Unable to load jobs right now. Please try again in a moment.</div>`;
    count.textContent = "";
  }
}

function renderJobs() {
  const q = search.value.trim().toLowerCase();
  const loc = locationFilter.value;
  const type = typeFilter.value;

  const jobs = allJobs.filter((job) => {
    const haystack =
      `${job.title} ${job.company} ${job.skills.join(" ")}`.toLowerCase();

    return (
      (!q || haystack.includes(q)) &&
      (!loc || job.location === loc) &&
      (!type || job.type === type)
    );
  });

  count.textContent = `${jobs.length} job${jobs.length === 1 ? "" : "s"} found`;

  container.innerHTML = jobs.length
    ? jobs.map(jobCardHtml).join("")
    : `<div class="empty-state">No matching jobs found. Try a different search or clear the filters.</div>`;
}

[search, locationFilter, typeFilter].forEach((el) => {
  el.addEventListener("input", renderJobs);
  el.addEventListener("change", renderJobs);
});

if (heroLocation) {
  heroLocation.addEventListener("change", () => {
    locationFilter.value = heroLocation.value;
    renderJobs();
  });
  locationFilter.addEventListener("change", () => {
    heroLocation.value = locationFilter.value;
  });
}

if (heroForm) {
  heroForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderJobs();
    document.getElementById("jobs").scrollIntoView({ behavior: "smooth" });
  });
}

if (clearButton) {
  clearButton.addEventListener("click", () => {
    search.value = "";
    locationFilter.value = "";
    if (heroLocation) heroLocation.value = "";
    typeFilter.value = "";
    renderJobs();
  });
}

loadJobs();
