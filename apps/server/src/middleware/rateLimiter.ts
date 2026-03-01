import rateLimit from "express-rate-limit";

const WINDOW_MS = 1 * 60 * 1000; // 1 Minute
const MAX_REQUESTS = 100;

export const rateLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    message: { error: "Request Limit Exceeded" },
    standardHeaders: true,
    legacyHeaders: false,
});
