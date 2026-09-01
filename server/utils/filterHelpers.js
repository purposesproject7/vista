/**
 * filterHelpers.js
 *
 * Centralized utilities for building MongoDB filter queries with:
 *  - Case-insensitive matching (partial contains, not exact)
 *  - Detailed debug logging showing what was expected vs. what the server got
 *
 * Used by studentService, facultyService, panelService, projectCoordinatorController, etc.
 */

import { logger } from "./logger.js";

/**
 * Escape special regex characters in a string so it can be used literally in RegExp.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive partial-match (contains) MongoDB query value for a single
 * string or an array of strings.
 *
 * - Single string  →  { $regex: /value/i }
 * - Array          →  { $in: [/value1/i, /value2/i, ...] }
 *
 * @param {string|string[]} value  The filter value from the request.
 * @param {string} fieldName       The DB field name (used for logging).
 * @param {string} [context]       Optional label for log messages (e.g. "StudentService").
 * @returns {Object}               A MongoDB query operator object.
 */
export function buildCaseInsensitiveFilter(value, fieldName, context = "Filter") {
  if (Array.isArray(value)) {
    const patterns = value.map((v) => new RegExp(escapeRegex(v), "i"));
    logger.debug(`[${context}] ${fieldName} filter (array, case-insensitive)`, {
      expected: value,
      regexPatterns: patterns.map(String),
    });
    return { $in: patterns };
  }

  const pattern = new RegExp(escapeRegex(value), "i");
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
      (dbVal) => typeof dbVal === "string" && dbVal.toLowerCase().includes(reqVal.toLowerCase())
    );

    if (!matchFound) {
      logger.warn(`[${context}] Possible mismatch on '${fieldName}': no DB value contains the requested filter`, {
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
  if (filters.school && filters.school !== "all") {
    query.school = buildCaseInsensitiveFilter(filters.school, "school", context);
    appliedFilters.school = filters.school;
  }

  // -- program --------------------------------------------------------------
  if (filters.program && filters.program !== "all") {
    query.program = buildCaseInsensitiveFilter(filters.program, "program", context);
    appliedFilters.program = filters.program;
  }

  // -- academicYear ---------------------------------------------------------
  if (filters.academicYear && filters.academicYear !== "all") {
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
