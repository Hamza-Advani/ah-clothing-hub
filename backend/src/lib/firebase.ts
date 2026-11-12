import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { configured, env } from "./env.js";
import { HttpError } from "./http.js";

let app: App | undefined;

function getApp(): App {
  if (!configured.firebase) throw new HttpError(503, "Firebase Admin is not configured yet. Add FIREBASE_* variables to backend/.env");
  if (!app) {
    app = getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          // .env files store the key with literal \n
          privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
  }
  return app;
}

export const db = () => getFirestore(getApp());
export const adminAuth = () => getAuth(getApp());
export { FieldValue, Timestamp };
