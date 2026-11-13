/**
 * One-time Firebase setup:
 *   npm run setup-firebase → deploy security rules + indexes and create the order-number counter.
 * No demo products are added — add your real catalogue from the admin panel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert } from "firebase-admin/app";
import { db, FieldValue } from "../src/lib/firebase.js";
import { env } from "../src/lib/env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const project = env.FIREBASE_PROJECT_ID!;

async function token() {
  const cred = cert({ projectId: project, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n") });
  return (await cred.getAccessToken()).access_token;
}

async function gapi(method: string, url: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, j };
}

async function deployRules() {
  const source = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  const rs = await gapi("POST", `https://firebaserules.googleapis.com/v1/projects/${project}/rulesets`, { source: { files: [{ name: "firestore.rules", content: source }] } });
  if (!rs.ok) throw new Error(`Rules compile failed: ${JSON.stringify(rs.j)}`);
  const name = `projects/${project}/releases/cloud.firestore`;
  const upd = await gapi("PATCH", `https://firebaserules.googleapis.com/v1/${name}`, { release: { name, rulesetName: rs.j.name } });
  if (!upd.ok) {
    const crt = await gapi("POST", `https://firebaserules.googleapis.com/v1/projects/${project}/releases`, { name, rulesetName: rs.j.name });
    if (!crt.ok) throw new Error(`Rules release failed: ${JSON.stringify(crt.j)}`);
  }
  console.log("✅ Firestore security rules deployed");
}

async function deployIndexes() {
  const { indexes } = JSON.parse(fs.readFileSync(path.join(root, "firestore.indexes.json"), "utf8")) as { indexes: { collectionGroup: string; queryScope: string; fields: { fieldPath: string; order: string }[] }[] };
  let created = 0;
  for (const ix of indexes) {
    const r = await gapi("POST", `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/${ix.collectionGroup}/indexes`, { queryScope: ix.queryScope, fields: ix.fields });
    if (r.ok) created++;
    else if (r.status !== 409) console.warn(`⚠️ index ${ix.collectionGroup}: ${r.j?.error?.message}`);
  }
  console.log(`✅ Indexes requested (${created} new; existing ones skipped). They take a few minutes to build.`);
}

async function seed() {
  const ref = db().doc("counters/orders");
  if (!(await ref.get()).exists) await ref.set({ next: 260001, createdAt: FieldValue.serverTimestamp() });
  console.log("✅ Order counter ready (no demo data added)");
}

await deployRules();
await deployIndexes();
await seed();
console.log("\n🎉 Firebase is ready. Next: sign up on the website, then run  npm run make-admin -- your@email.com");
process.exit(0);
