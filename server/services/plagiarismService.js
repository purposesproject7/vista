import crypto from "crypto";
import { logger } from "../utils/logger.js";

const PROVIDER = process.env.PLAGIARISM_PROVIDER || "mock";

/**
 * Deterministic 0-100 score derived from a hash of the input text, so
 * repeated identical submissions always produce the same score (useful
 * for reliably exercising the "flagged" state in QA/demos).
 */
function deterministicScore(text, salt) {
  const hash = crypto.createHash("sha256").update(`${salt}:${text}`).digest();
  return hash.readUInt16BE(0) % 101;
}

export class PlagiarismService {
  /**
   * Check a block of text for plagiarism and AI-generated content.
   * Returns { plagiarismScore, aiScore } as 0-100 numbers.
   *
   * This is a mock implementation. Swap PLAGIARISM_PROVIDER to a real
   * vendor value and add a branch here to call a real API, keeping this
   * method signature unchanged for callers.
   */
  static async checkContent(text) {
    if (PROVIDER !== "mock") {
      logger.warn("plagiarism_provider_not_implemented", { provider: PROVIDER });
    }

    const plagiarismScore = deterministicScore(text, "plagiarism");
    const aiScore = deterministicScore(text, "ai");

    logger.info("plagiarism_check_completed", {
      provider: PROVIDER,
      plagiarismScore,
      aiScore,
      textLength: text.length,
    });

    return { plagiarismScore, aiScore };
  }
}
