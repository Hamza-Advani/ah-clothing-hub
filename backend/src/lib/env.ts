import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SITE_URL: z.string().default("http://localhost:3000"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("AH Clothing Hub <onboarding@resend.dev>"),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),
  /** Comma-separated allow-list: only these emails may use admin/staff roles (defence in depth on top of custom claims). */
  ADMIN_EMAILS: z.string().optional(),
});

export const env = schema.parse(process.env);

/**
 * Convenience: if the Firebase service-account JSON (downloaded from Firebase console)
 * is placed in the backend folder, use it automatically. The file is gitignored.
 */
if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
  try {
    const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    const file = fs.readdirSync(dir).find((f) => /firebase-adminsdk.*\.json$|service-?account.*\.json$/i.test(f));
    if (file) {
      const sa = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      env.FIREBASE_PROJECT_ID ||= sa.project_id;
      env.FIREBASE_CLIENT_EMAIL = sa.client_email;
      env.FIREBASE_PRIVATE_KEY = sa.private_key;
    }
  } catch {
    /* ignore */
  }
}

export const configured = {
  firebase: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
  cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
  resend: Boolean(env.RESEND_API_KEY),
};
