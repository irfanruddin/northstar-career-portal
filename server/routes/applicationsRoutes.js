const express = require("express");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes[extension] || file.mimetype !== allowedTypes[extension]) {
      return cb(new Error("Only PDF, DOC, and DOCX files are allowed."));
    }

    cb(null, true);
  },
});

// router.post("/", authenticateToken, async (req, res) => {
router.post(
  "/",
  authenticateToken,
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "Resume file must be 5 MB or smaller.",
            });
          }

          return res.status(400).json({
            message: err.message || "Resume upload failed.",
          });
        }

        return res.status(400).json({
          message: err.message || "Invalid resume file.",
        });
      }

      next();
    });
  },
  async (req, res) => {

    try {
      const userId = req.user.id;

      const { jobId, name, email, phone, education, skills } = req.body;

      const resumeName = req.file ? req.file.originalname : null;

      const resumePath = req.file ? req.file.filename : null;

      if (!jobId) {
        return res.status(400).json({
          message: "Job ID is required.",
        });
      }

      if (!name || !email || !phone || !education || !skills) {
        return res.status(400).json({
          message: "All application fields are required.",
        });
      }

      const emailPattern =
  /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
          message: "Please enter a valid email address.",
        });
      }

      const phonePattern = /^[+]?[0-9\s-]{10,15}$/;

      if (!phonePattern.test(String(phone).trim())) {
        return res.status(400).json({
          message: "Please enter a valid phone number.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Resume is required.",
        });
      }

      const [jobs] = await db.execute(
        `SELECT id, title, company
             FROM jobs
             WHERE id = ?`,
        [jobId],
      );

      if (jobs.length === 0) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      const job = jobs[0];

      const [existing] = await db.execute(
        `SELECT id
             FROM applications
             WHERE user_id = ? AND job_id = ?`,
        [userId, jobId],
      );

      if (existing.length > 0) {
        return res.status(409).json({
          message: "You have already applied for this job.",
        });
      }

      await db.execute(
        `INSERT INTO applications
     (
        user_id,
        job_id,
        job_title,
        company,
        applicant_name,
        applicant_email,
        applicant_phone,
        applicant_education,
        applicant_skills,
        resume_name,
        resume_path
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          job.id,
          job.title,
          job.company,
          name.trim(),
          email.trim().toLowerCase(),
          String(phone || "").trim(),
          String(education || "").trim(),
          String(skills || "").trim(),
          resumeName,
          resumePath,
        ],
      );

      res.status(201).json({
        message: "Application submitted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error while submitting application.",
      });
    }
  },
);

router.get("/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [applications] = await db.execute(
      `SELECT
                id,
                job_id,
                job_title,
                company,
                status,
                applied_at
             FROM applications
             WHERE user_id = ?
             ORDER BY applied_at DESC`,
      [userId],
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
});

module.exports = router;
