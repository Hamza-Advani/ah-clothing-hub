import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "../lib/firebase.js";
import { HttpError } from "../lib/http.js";
import { env } from "../lib/env.js";

const adminAllow = (env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export type Role = "customer" | "staff" | "admin";
export type AuthedUser = { uid: string; email?: string; name?: string; role: Role };

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedUser;
  }
}

async function decode(req: Request): Promise<AuthedUser | undefined> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return undefined;
  try {
    const t = await adminAuth().verifyIdToken(h.slice(7), true);
    let role: Role = (t.role as Role) ?? "customer";
    // privileged roles also require a verified email on the allow-list (when configured)
    if (role !== "customer" && adminAllow.length && !(t.email_verified && t.email && adminAllow.includes(t.email.toLowerCase()))) role = "customer";
    return { uid: t.uid, email: t.email, name: t.name as string | undefined, role };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Your session has expired. Please log in again.");
  }
}

/** Attaches req.user when a valid token is present (guest checkout allowed). */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.user = await decode(req);
    next();
  } catch (e) {
    next(e);
  }
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.user = await decode(req);
    if (!req.user) throw new HttpError(401, "Please log in to continue.");
    next();
  } catch (e) {
    next(e);
  }
};

/** Admin & staff gate — always verified on the server via Firebase custom claims. */
export const requireRole =
  (...roles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    await requireAuth(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, "You don't have permission to do this."));
      next();
    });
  };

export const requireStaff = requireRole("admin", "staff");
export const requireAdmin = requireRole("admin");
