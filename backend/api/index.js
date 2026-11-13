// Vercel serverless entry: the TypeScript source is compiled + bundled to dist/server.mjs by `npm run build`.
// Firestore (and its gRPC/proto deps) stays outside the bundle; this import makes Vercel ship it with the function.
import "@google-cloud/firestore";
import app from "../dist/server.mjs";

export default app;
