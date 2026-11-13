// Vercel serverless entry: the TypeScript source is compiled + bundled to dist/server.mjs by `npm run build`.
// Firestore and React Email stay outside the bundle; these imports make Vercel ship them with the function.
import "@google-cloud/firestore";
import "@react-email/components";
import "react-dom/server";
import app from "../dist/server.mjs";

export default app;
