import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: number;
  email: string;
  role: "user" | "admin";
};

export function getUserFromRequest(req: Request): AuthUser | null {
  const token = req.cookies?.token;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.SESSION_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  (req as any).user = user;
  next();
}
