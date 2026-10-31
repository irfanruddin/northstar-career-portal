requireLogin();

const container = document.getElementById("jobsContainer");
const search = document.getElementById("jobSearch");
const locationFilter = document.getElementById("locationFilter");
const typeFilter = document.getElementById("typeFilter");
const count = document.getElementById("jobCount");

let allJobs = [];

async function loadJobs() {
  try {
    const response = await fetch(apiUrl("/api/jobs"));

    if (!response.ok) {
      throw new Error("Unable to fetch jobs");
    }

    const data = await response.json();

    allJobs = normaliseJobs(data.jobs);

    fillSelect(locationFilter, allJobs.map((job) => job.location));
    fillSelect(typeFilter, allJobs.map((job) => job.type));

    renderJobs();
  } catch (error) {
    console.error("Error loading jobs:", error);

    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        Unable to load jobs. Please try again later.
      </div>
    `;

    count.textContent = "0 opportunities";
  }
}

function renderJobs() {
  const q = search.value.trim().toLowerCase();
  const loc = locationFilter.value;
  const type = typeFilter.value;

  const jobs = allJobs.filter((job) => {
    const haystack = `${job.title} ${job.company} ${job.skills.join(" ")}`.toLowerCase();

    return (
      (!q || haystack.includes(q)) &&
      (!loc || job.location === loc) &&
      (!type || job.type === type)
    );
  });

  count.textContent = `${jobs.length} opportunit${jobs.length === 1 ? "y" : "ies"}`;

  container.innerHTML = jobs.length
    ? jobs.map(jobCardHtml).join("")
    : `
        <div class="empty-state" style="grid-column:1/-1">
          No matching jobs found.
        </div>
      `;
}

[search, locationFilter, typeFilter].forEach((el) => {
  el.addEventListener("input", renderJobs);
  el.addEventListener("change", renderJobs);
});

loadJobs();
