import { logger } from "../utils/logger.js";

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframe tags
          .replace(/javascript:/gi, "") // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, ""); // Remove event handlers

        // MongoDB operator sanitization
        if (key.startsWith("$")) {
          logger.warn("sanitize_blocked_operator", {
            key,
            value: obj[key],
            requestId: req.requestId,
          });
          delete obj[key];
        }
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }

    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

export default sanitizeInput;
