import crypto from "crypto";
import { logger, safeMeta } from "../utils/logger.js";

/**
 * Generates unique request ID and attaches request-scoped logger
 */
export default function correlationId(req, res, next) {
  // Generate unique request ID
  const id =
    crypto.randomUUID && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");

  // Attach to request and response
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  res.locals.requestId = id;

  // Attach logger helper that includes requestId and user info
  req.log = (level, event, meta = {}) => {
    const user = req.user
      ? {
          id: req.user._id || req.user.id,
          role: req.user.role,
          employeeId: req.user.employeeId,
        }
      : null;

    logger.log({
      level: level || "info",
      message: event,
      requestId: id,
      user,
      ...safeMeta(meta),
    });
  };

  // Log request ID assignment
  logger.info(
    "request_assigned_id",
    safeMeta({
      requestId: id,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
    }),
  );

  next();
}
