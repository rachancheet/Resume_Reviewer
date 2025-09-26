// server.js
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

function authMiddleware(role = "user") {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (role === "admin" && decoded.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

app.post("/auth/login", async (req, res) => {
  const { email } = req.body;

  let user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (user.rows.length === 0) {
    user = await pool.query(
      "INSERT INTO users (email) VALUES ($1) RETURNING *",
      [email]
    );
  }

  const token = jwt.sign(
    { id: user.rows[0].id, role: user.rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

app.post("/resumes/upload", authMiddleware("user"), upload.single("resume"), async (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      "INSERT INTO resumes (user_id, file_url) VALUES ($1, $2) RETURNING *",
      [req.user.id, fileUrl]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/resumes", authMiddleware("user"), async (req, res) => {
  const result = await pool.query("SELECT * FROM resumes WHERE user_id=$1", [
    req.user.id,
  ]);
  res.json(result.rows);
});

app.get("/admin/resumes", authMiddleware("admin"), async (req, res) => {
  const result = await pool.query(
    "SELECT resumes.*, users.email FROM resumes JOIN users ON resumes.user_id = users.id"
  );
  res.json(result.rows);
});

app.put("/admin/resumes/:id", authMiddleware("admin"), async (req, res) => {
  const { status, score, notes } = req.body;
  const result = await pool.query(
    "UPDATE resumes SET status=$1, score=$2, notes=$3 WHERE id=$4 RETURNING *",
    [status, score, notes, req.params.id]
  );
  res.json(result.rows[0]);
});

app.get("/leaderboard", async (req, res) => {
  const result = await pool.query(
    "SELECT users.email, score FROM resumes JOIN users ON resumes.user_id = users.id WHERE score IS NOT NULL ORDER BY score DESC LIMIT 10"
  );
  res.json(result.rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
