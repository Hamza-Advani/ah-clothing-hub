/**
 * Make an existing user an admin (or staff).
 *   npm run make-admin -- you@email.com
 *   npm run make-admin -- staff@email.com staff
 * The user must sign up on the website first. They must log out & in again afterwards.
 */
import { adminAuth, db, FieldValue } from "../src/lib/firebase.js";

const [email, role = "admin"] = process.argv.slice(2);
if (!email || !["admin", "staff"].includes(role)) {
  console.error("Usage: npm run make-admin -- <email> [admin|staff]");
  process.exit(1);
}

const user = await adminAuth().getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No Firebase user with email ${email}. Sign up on the website first.`);
  process.exit(1);
}
await adminAuth().setCustomUserClaims(user.uid, { role });
await db().doc(`admins/${user.uid}`).set({ uid: user.uid, email, name: user.displayName ?? "", role, permissions: ["*"], createdAt: FieldValue.serverTimestamp() }, { merge: true });
await db().doc(`users/${user.uid}`).set({ role }, { merge: true });
console.log(`✅ ${email} is now ${role}. Log out and log in again to activate.`);
process.exit(0);
