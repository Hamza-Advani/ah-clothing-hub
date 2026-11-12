import rateLimit from "express-rate-limit";

const opts = { standardHeaders: "draft-7" as const, legacyHeaders: false, message: { error: "Too many requests. Please wait a moment and try again." } };

export const generalLimiter = rateLimit({ windowMs: 60_000, limit: 120, ...opts });
/** Order placement, coupon checks, contact form, reviews. */
export const strictLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 20, ...opts });
export const uploadLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 60, ...opts });
