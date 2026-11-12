import express from "express";
import cors from "cors";
import helmet from "helmet";
import { configured, env } from "./lib/env.js";
import { errorHandler } from "./lib/http.js";
import { generalLimiter } from "./middleware/rate-limit.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
const origins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(cors({ origin: (origin, cb) => cb(null, !origin || origins.includes(origin)), credentials: false }));
app.use(express.json({ limit: "500kb" }));
app.use(generalLimiter);

app.get("/", (_req, res) => res.json({ name: "AH Clothing Hub API", status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, configured }));
app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);
