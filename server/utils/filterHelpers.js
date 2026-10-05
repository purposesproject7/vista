/** Exact, case-insensitive academic filters; the model boundary expands configured codes and names. */

import { logger } from "./logger.js";
import { exactContextRegex, isAllContext } from "./academicContext.js";

/**
 * Escape special regex characters in a string so it can be used literally in RegExp.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** MongoDB regex queries match both scalar strings and elements of string arrays. */
export function buildCaseInsensitiveFilter(value, fieldName, context = "Filter") {
  if (Array.isArray(value)) {
    // Combine all values into a single alternation regex.
    // This correctly matches both scalar String fields and [String] array fields in MongoDB.
    const pattern = new RegExp(`^\\s*(?:${value.map((v) => escapeRegex(String(v).trim())).join("|") || "(?!)"})\\s*$`, "i");
    logger.debug(`[${context}] ${fieldName} filter (array→combined $regex, case-insensitive)`, {
      expected: value,
      regexPattern: String(pattern),
    });
    return { $regex: pattern };
  }

  const pattern = exactContextRegex(value);
  logger.debug(`[${context}] ${fieldName} filter (string, case-insensitive)`, {
    expected: value,
    regexPattern: String(pattern),
  });
  return { $regex: pattern };
}

/**
 * Validate incoming filter values against known DB values, and log a warning
 * when a mismatch is detected. Helps pinpoint data inconsistency (e.g. coordinator
 * stores "M.Tech Integrated" but DB uses "M.Tech Integrated (5 Yrs.)").
 *
 * @param {string|string[]} requested   The value(s) from the incoming request / coordinator context.
 * @param {string[]} dbValues           Distinct values actually present in the DB collection.
 * @param {string} fieldName            Field being validated (e.g. "program").
 * @param {string} [context]            Optional caller label for log messages.
 */
export function warnOnFilterMismatch(requested, dbValues, fieldName, context = "Filter") {
  const requestedArr = Array.isArray(requested) ? requested : [requested];

  requestedArr.forEach((reqVal) => {
    const matchFound = dbValues.some(
      (dbVal) => typeof dbVal === "string" && dbVal.trim().toLowerCase() === String(reqVal).trim().toLowerCase()
    );

    if (!matchFound) {
      logger.warn(`[${context}] Possible mismatch on '${fieldName}': no DB value equals the requested filter (configured aliases may still match)`, {
        requested: reqVal,
        availableInDB: dbValues,
        hint: "Check if the coordinator program/school/academicYear name differs from what is stored in the DB.",
      });
    }
  });
}

/**
 * Build a complete filter query object for the three standard coordinator dimensions:
 * school, program, academicYear.  Handles "all" sentinel values and logs the
 * resolved filter at debug level.
 *
 * @param {Object} filters              Raw filters object (from req.query merged with coordinator context).
 * @param {string} [context]            Optional caller label for log messages.
 * @returns {{ query: Object, appliedFilters: Object }}
 *   query           - MongoDB query operators ready to spread into a larger query.
 *   appliedFilters  - Human-readable summary of what was applied (for response logging).
 */
export function buildCoordinatorFilterQuery(filters, context = "CoordinatorFilter") {
  const query = {};
  const appliedFilters = {};

  // -- school ---------------------------------------------------------------
  if (filters.school && !isAllContext(filters.school)) {
    query.school = buildCaseInsensitiveFilter(filters.school, "school", context);
    appliedFilters.school = filters.school;
  }

  // -- program --------------------------------------------------------------
  if (filters.program && !isAllContext(filters.program)) {
    query.program = buildCaseInsensitiveFilter(filters.program, "program", context);
    appliedFilters.program = filters.program;
  }

  // -- academicYear ---------------------------------------------------------
  if (filters.academicYear && !isAllContext(filters.academicYear)) {
    query.academicYear = buildCaseInsensitiveFilter(filters.academicYear, "academicYear", context);
    appliedFilters.academicYear = filters.academicYear;
  }

  logger.info(`[${context}] Resolved filter query`, {
    rawFilters: {
      school: filters.school,
      program: filters.program,
      academicYear: filters.academicYear,
    },
    appliedFilters,
  });

  return { query, appliedFilters };
}
