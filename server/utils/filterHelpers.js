/**
 * filterHelpers.js
 *
 * Centralized utilities for building MongoDB filter queries with:
 *  - Case-insensitive matching
 *  - Detailed debug logging showing what was expected vs. what the server got
 *
 * IMPORTANT — Array field compatibility:
 *   Faculty.program is stored as [String] (array). MongoDB's { $regex } operator
 *   is automatically applied to each element of an array field, so it works for
 *   both scalar String fields (Student.program, Student.school) and [String] array
 *   fields (Faculty.program). The older { $in: [/regex1/, /regex2/] } approach only
 *   works against scalar String fields and silently returns 0 results when the DB
 *   field is an array — that was the root cause of coordinators seeing empty faculty
 *   and student lists despite data existing in the database.
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
 * Always uses { $regex } — never { $in: [regex, ...] } — because:
 *   { $regex: /pattern/i } works on BOTH scalar String fields AND [String] array fields.
 *   MongoDB automatically tests the regex against every element of an array field.
 *   By contrast, { $in: [/regex/i] } only works on scalar String fields and silently
 *   returns no results when the DB field is an array (e.g. Faculty.program).
 *
 * - Single string  →  { $regex: /escapedValue/i }
 * - Array          →  { $regex: /(val1|val2|...)/i }  (alternation, works for both field types)
 *
 * @param {string|string[]} value  The filter value from the request.
 * @param {string} fieldName       The DB field name (used for logging).
 * @param {string} [context]       Optional label for log messages (e.g. "StudentService").
 * @returns {Object}               A MongoDB query operator object.
 */
export function buildCaseInsensitiveFilter(value, fieldName, context = "Filter") {
  if (Array.isArray(value)) {
    // Combine all values into a single alternation regex.
    // This correctly matches both scalar String fields and [String] array fields in MongoDB.
    const pattern = new RegExp(value.map((v) => escapeRegex(String(v))).join("|"), "i");
    logger.debug(`[${context}] ${fieldName} filter (array→combined $regex, case-insensitive)`, {
      expected: value,
      regexPattern: String(pattern),
    });
    return { $regex: pattern };
  }

  const pattern = new RegExp(escapeRegex(String(value)), "i");
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
