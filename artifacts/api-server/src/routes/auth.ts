import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { getUserFromRequest } from "../auth";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email],
  );

  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.SESSION_SECRET!, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: payload });
});

router.post("/auth/logout", async (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const user = getUserFromRequest(req);
  res.json({ user });
});

router.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: "Email and password min 8 chars required" });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    [email, passwordHash],
  );

  res.status(201).json({ user: result.rows[0] });
});

export default router;
