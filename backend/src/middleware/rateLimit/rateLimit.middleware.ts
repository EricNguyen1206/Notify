import rateLimit from "express-rate-limit";
import { config } from "@/config/config";

export const createRateLimit = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || config.rateLimit.windowMs,
    max: max || config.rateLimit.maxRequests,
    message: {
      code: 429,
      message: "Too Many Requests",
      details: "Rate limit exceeded. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const generalRateLimit = createRateLimit(); // Use default config
export const strictRateLimit = createRateLimit(60 * 1000, 10); // 10 requests per minute
