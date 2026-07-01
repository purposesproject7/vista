/**
 * Sanitize user input to prevent injection attacks
 * - Trims whitespace
 * - Strips HTML/script tags
 * - Removes MongoDB operator keys (NoSQL injection prevention)
 */
export default function sanitizeInput(req, res, next) {
  // ✅ Sanitize body (works because body is writable)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // ✅ Sanitize query (replace properties, not the object itself)
  if (req.query && typeof req.query === "object") {
    sanitizeObjectInPlace(req.query);
  }

  // ✅ Sanitize params (replace properties, not the object itself)
  if (req.params && typeof req.params === "object") {
    sanitizeObjectInPlace(req.params);
  }

  next();
}

function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.trim().replace(/<[^>]*>/g, "");
  }
  return value;
}

function sanitizeObjectInPlace(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "string") {
      obj[key] = value.trim().replace(/<[^>]*>/g, "");
    } else if (typeof value === "object" && value !== null) {
      sanitizeObjectInPlace(value);
    }
  }
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip MongoDB operator keys to prevent NoSQL injection
    if (key.startsWith("$")) continue;

    if (typeof value === "string") {
      sanitized[key] = value.trim().replace(/<[^>]*>/g, "");
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "object" && item !== null ? sanitizeObject(item) : sanitizeValue(item),
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
