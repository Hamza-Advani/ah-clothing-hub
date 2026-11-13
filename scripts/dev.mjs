// Starts backend (http://localhost:4000) and frontend (http://localhost:3000) together.
// Usage (project root): npm run dev      — Ctrl+C stops both.
import { spawn } from "node:child_process";

const procs = [
  { name: "backend ", color: "\x1b[36m", cwd: "backend" },
  { name: "frontend", color: "\x1b[35m", cwd: "frontend" },
].map(({ name, color, cwd }) => {
  const p = spawn("npm", ["run", "dev"], { cwd, shell: true, env: process.env });
  const out = (buf) =>
    buf.toString().split(/\r?\n/).filter(Boolean).forEach((l) => console.log(`${color}[${name}]\x1b[0m ${l}`));
  p.stdout.on("data", out);
  p.stderr.on("data", out);
  p.on("exit", (code) => console.log(`${color}[${name}]\x1b[0m stopped (code ${code})`));
  return p;
});

const stop = () => {
  procs.forEach((p) => p.kill());
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
