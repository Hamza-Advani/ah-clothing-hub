/**
 * Make a user an admin (or staff). Creates the account if it doesn't exist yet.
 *   npm run make-admin -- you@email.com
 *   npm run make-admin -- you@email.com admin --password "YourPassword" --name "Your Name"
 *   npm run make-admin -- staff@email.com staff
 * --password also (re)sets the login password for an existing account.
 * After running, log out & log in again (or just refresh the admin page) to activate.
 */
import { adminAuth, db, FieldValue } from "../src/lib/firebase.js";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const password = flag("password");
const nameArg = flag("name");
const [email, role = "admin"] = args;

if (!email || !["admin", "staff"].includes(role)) {
  console.error('Usage: npm run make-admin -- <email> [admin|staff] [--password "..."] [--name "..."]');
  process.exit(1);
}
if (password !== undefined && password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

let user = await adminAuth().getUserByEmail(email).catch(() => null);
if (!user) {
  if (!password) {
    console.error(`No Firebase user with email ${email}. Sign up on the website first, or pass --password to create the account.`);
    process.exit(1);
  }
  user = await adminAuth().createUser({ email, password, displayName: nameArg ?? email.split("@")[0], emailVerified: true });
  console.log(`👤 Created account ${email}`);
} else if (password || nameArg) {
  user = await adminAuth().updateUser(user.uid, { ...(password ? { password } : {}), ...(nameArg ? { displayName: nameArg } : {}), disabled: false });
  if (password) console.log("🔑 Password updated");
}

const name = user.displayName ?? nameArg ?? "";
await adminAuth().setCustomUserClaims(user.uid, { role });
await db().doc(`admins/${user.uid}`).set({ uid: user.uid, email, name, role, permissions: ["*"], createdAt: FieldValue.serverTimestamp() }, { merge: true });
const userRef = db().doc(`users/${user.uid}`);
if ((await userRef.get()).exists) await userRef.set({ role }, { merge: true });
else
  await userRef.set({ uid: user.uid, name, email, phone: "", photoURL: null, role, blocked: false, addresses: [], wishlist: [], ordersCount: 0, totalSpent: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });

console.log(`✅ ${email} is now ${role}. Open /admin/login and sign in.`);
process.exit(0);
