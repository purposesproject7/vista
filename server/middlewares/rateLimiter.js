import crypto from "crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { logger } from "../utils/logger.js";

/**
 * Most of our users sit behind the campus NAT, so every one of them presents
 * the same public IP to nginx. Keying purely on IP therefore shares a single
 * bucket across the whole college. When a bearer token is present we key on a
 * hash of it (one bucket per logged-in session) and only fall back to the IP
 * for genuinely anonymous traffic.
 */
const sessionOrIpKey = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    return `s:${crypto.createHash("sha256").update(token).digest("hex")}`;
  }
  return `i:${ipKeyGenerator(req.ip)}`;
};

/**
 * Rate limiter to prevent abuse
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Per logged-in session (see sessionOrIpKey), not per IP
  keyGenerator: sessionOrIpKey,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn("rate_limit_exceeded", {
      ip: req.ip,
      path: req.path,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/";
  },
});

/**
 * Dedicated brute-force protection for login. Always active (not gated by
 * NODE_ENV, unlike the generic global limiter) since credential-guessing
 * matters in every environment.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per targeted account per window
  // Brute-force protection is about the account being guessed, not the source
  // address; keying on IP would lock out the entire NATed campus at once.
  keyGenerator: (req) =>
    req.body?.emailId
      ? `e:${String(req.body.emailId).toLowerCase()}`
      : ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("login_rate_limit_exceeded", {
      ip: req.ip,
      path: req.path,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Caps OTP resend requests per target email (not just per IP), since resend
 * abuse is about spamming a specific victim's inbox regardless of which IP
 * the attacker uses.
 */
export const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.body?.emailId
      ? `e:${String(req.body.emailId).toLowerCase()}`
      : ipKeyGenerator(req.ip),
  handler: (req, res) => {
    logger.warn("resend_otp_rate_limit_exceeded", {
      ip: req.ip,
      emailId: req.body?.emailId,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: "Too many OTP resend requests. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

export default rateLimiter;
