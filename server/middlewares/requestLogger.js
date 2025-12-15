import { logger, safeMeta } from "../utils/logger.js";

/**
 * Logs incoming requests and completion with timing
 */
export default function requestLogger(req, res, next) {
  const start = Date.now();

  const user = req.user
    ? {
        id: req.user._id || req.user.id,
        email: req.user.emailId || req.user.email || null,
        role: req.user.role || null,
      }
    : null;

  const requestId = req.requestId || res.locals.requestId || null;

  // Log incoming request
  logger.info(
    "incoming_request",
    safeMeta({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      user,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
      userAgent: req.get("user-agent") || null,
      bodySummary: Object.keys(req.body || {}).length
        ? Object.keys(req.body).slice(0, 10)
        : [],
      queryParams: Object.keys(req.query || {}).length
        ? Object.keys(req.query)
        : [],
    }),
  );

  // Log completion on response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log(
      level,
      "request_complete",
      safeMeta({
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        user,
        ...(duration > 3000 && { slow: true }),
      }),
    );
  });

  // Log aborted requests
  res.on("close", () => {
    if (!res.writableEnded) {
      const duration = Date.now() - start;
      logger.warn(
        "request_aborted",
        safeMeta({
          requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          durationMs: duration,
          user,
        }),
      );
    }
  });

  next();
}
