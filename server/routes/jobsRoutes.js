const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [jobs] = await db.execute(
      `SELECT 
                id,
                title,
                company,
                location,
                type,
                salary,
                skills,
                description,
                created_at
             FROM jobs
             ORDER BY created_at DESC`,
    );

    res.json({
      jobs: jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while fetching jobs.",
    });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid job ID.",
      });
    }

    const [jobs] = await db.execute(
      `SELECT
                id,
                title,
                company,
                location,
                type,
                salary,
                skills,
                description,
                created_at
             FROM jobs
             WHERE id = ?`,
      [id],
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    const job = jobs[0];

    res.json({
      job: {
        ...job,
        skills: job.skills
          ? job.skills.split(",").map((skill) => skill.trim())
          : [],
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while fetching job.",
    });
  }
});

module.exports = router;
