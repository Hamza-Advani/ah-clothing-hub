// Bundles the compiled API into one ESM file for Vercel (dist/server.mjs).
// Needed because Vercel's runtime can't require() ESM-only packages (jose, used by firebase-admin).
import { build } from "esbuild";

await build({
  entryPoints: ["dist/index.js"],
  outfile: "dist/server.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  // Google Cloud libs load .proto/.json files from disk at runtime — keep them as normal node_modules.
  // React Email breaks when bundled (lazy-init order) — load it from node_modules instead.
  external: ["@google-cloud/*", "google-gax", "@grpc/*", "protobufjs", "@react-email/*", "react", "react-dom"],
  banner: {
    js: [
      'import { createRequire as __cr } from "node:module";',
      'import { fileURLToPath as __fu } from "node:url";',
      'import { dirname as __dn } from "node:path";',
      "const require = __cr(import.meta.url);",
      "const __filename = __fu(import.meta.url);",
      "const __dirname = __dn(__filename);",
    ].join("\n"),
  },
  logLevel: "warning",
});
console.log("bundled dist/server.mjs");
