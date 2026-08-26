const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

// Get all jobs
router.get("/jobs", authenticateToken, requireAdmin, async (req, res) => {
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

    const formattedJobs = jobs.map((job) => ({
      ...job,
      skills: job.skills
        ? job.skills.split(",").map((skill) => skill.trim())
        : [],
    }));

    res.json({
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while fetching admin jobs.",
    });
  }
});

// Add a new job
router.post("/jobs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, company, location, type, salary, skills, description } =
      req.body;

    if (!title || !company || !location || !type) {
      return res.status(400).json({
        message: "Title, company, location and type are required.",
      });
    }

    const skillsText = Array.isArray(skills)
      ? skills.join(", ")
      : String(skills || "");

    const [result] = await db.execute(
      `INSERT INTO jobs
             (title, company, location, type, salary, skills, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        company.trim(),
        location.trim(),
        type,
        String(salary || "").trim(),
        skillsText,
        String(description || "").trim(),
      ],
    );

    res.status(201).json({
      message: "Job added successfully.",
      jobId: result.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while adding job.",
    });
  }
});
// Get all applications
router.get(
  "/applications",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [applications] = await db.execute(
    `SELECT
        a.id,
        a.user_id,
        a.job_id,
        a.job_title,
        a.company,
        a.status,
        a.applied_at,
        a.applicant_name,
        a.applicant_email,
        a.applicant_phone,
        a.applicant_education,
        a.applicant_skills,
        a.resume_name,
        a.resume_path
     FROM applications a
     ORDER BY a.applied_at DESC`
);

      res.json({
        applications,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error while fetching applications.",
      });
    }
  },
);
// Update application status
router.put(
  "/applications/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const applicationId = Number(req.params.id);
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Under Review",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected",
      ];

      if (!Number.isInteger(applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status.",
        });
      }

      const [result] = await db.execute(
        `UPDATE applications
                 SET status = ?
                 WHERE id = ?`,
        [status, applicationId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      res.json({
        message: "Application status updated successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error while updating application.",
      });
    }
  },
);
// Delete a job
router.delete(
  "/jobs/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const jobId = Number(req.params.id);

      if (!Number.isInteger(jobId)) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      const [result] = await db.execute("DELETE FROM jobs WHERE id = ?", [
        jobId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      res.json({
        message: "Job deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error while deleting job.",
      });
    }
  },
);
// Update a job
router.put("/jobs/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const jobId = Number(req.params.id);

    const { title, company, location, type, salary, skills, description } =
      req.body;

    if (!Number.isInteger(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID.",
      });
    }

    if (!title || !company || !location || !type) {
      return res.status(400).json({
        message: "Title, company, location and type are required.",
      });
    }

    const skillsText = Array.isArray(skills)
      ? skills.join(", ")
      : String(skills || "");

    const [result] = await db.execute(
      `UPDATE jobs
                 SET title = ?,
                     company = ?,
                     location = ?,
                     type = ?,
                     salary = ?,
                     skills = ?,
                     description = ?
                 WHERE id = ?`,
      [
        title.trim(),
        company.trim(),
        location.trim(),
        type,
        String(salary || "").trim(),
        skillsText,
        String(description || "").trim(),
        jobId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    res.json({
      message: "Job updated successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while updating job.",
    });
  }
});

// Download/View application resume
router.get(
  "/applications/:id/resume",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const applicationId = Number(req.params.id);

      if (!Number.isInteger(applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      const [applications] = await db.execute(
        `SELECT resume_path, resume_name
         FROM applications
         WHERE id = ?`,
        [applicationId]
      );

      if (applications.length === 0) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      const application = applications[0];

      if (!application.resume_path) {
        return res.status(404).json({
          message: "No resume attached to this application.",
        });
      }

      const filePath = path.join(
        uploadDir,
        application.resume_path
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Resume file not found.",
        });
      }

      const extension = path.extname(application.resume_path).toLowerCase();
      const contentTypes = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      res.sendFile(filePath, {
        headers: {
          "Content-Type": contentTypes[extension] || "application/octet-stream",
          "Content-Disposition": `inline; filename="${path.basename(application.resume_name || application.resume_path)}"`,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error while downloading resume.",
      });
    }
  }
);

module.exports = router;
