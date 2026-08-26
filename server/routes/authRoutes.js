const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const phonePattern = /^[+]?[0-9\s-]{10,15}$/;
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});

router.post("/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const phone = String(req.body.phone || "").trim();

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required.",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!phonePattern.test(phone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users (name, email, password, phone)
             VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null],
    );

    res.status(201).json({
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while creating account.",
    });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const [users] = await db.execute(
      "SELECT id, name, email, password, phone, role FROM users WHERE email = ?",
      [email],
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        education: "",
        skills: "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error while signing in.",
    });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            "SELECT id, name, email, phone, education, skills FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const user = users[0];

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                education: user.education || "",
                skills: user.skills || "",
                role: req.user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error while fetching user."
        });
    }
});

router.put("/profile", authenticateToken, async (req, res) => {
    try {
      
        const userId = req.user.id;

        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").trim();
        const education = String(req.body.education || "").trim();
        const skills = String(req.body.skills || "").trim();

        if (!name || !phone || !education || !skills) {
            return res.status(400).json({
            message: "Name, phone, education and skills are required."
            });
        }

        if (!phonePattern.test(phone)) {
          return res.status(400).json({
            message: "Please enter a valid phone number."
          });
        }

        await db.execute(
            `UPDATE users
             SET name = ?,
                 phone = ?,
                 education = ?,
                 skills = ?
             WHERE id = ?`,
            [name, phone || null, education, skills, userId]
        );

        res.json({
            message: "Profile updated successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error while updating profile."
        });
    }
});

module.exports = router;
