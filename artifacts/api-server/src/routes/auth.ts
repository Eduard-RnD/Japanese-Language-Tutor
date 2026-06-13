import { Router } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { getUserFromRequest } from "../auth";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
  query_timeout: 10_000,
  statement_timeout: 10_000,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setAuthCookie(res: Response, payload: object) {
  const token = jwt.sign(payload, process.env.SESSION_SECRET!, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

router.post("/auth/login", async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

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

  setAuthCookie(res, payload);

  res.json({ user: payload });
});

router.post("/auth/logout", async (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const user = getUserFromRequest(req);
  res.json({ user });
});

router.post("/auth/register", async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rowCount) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
      [email, passwordHash],
    );
    const user = result.rows[0];

    setAuthCookie(res, user);
    res.status(201).json({ user });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    throw error;
  }
});

export default router;
