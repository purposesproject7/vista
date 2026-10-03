import Project from "../models/projectSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { PlagiarismService } from "./plagiarismService.js";
import { checkSimilarity, embed, embeddingText } from "./similarityService.js";
import { logger } from "../utils/logger.js";

// Similarity to an existing project (0-100). Embedding cosine scores sit high
// even for unrelated abstracts, so these are separate from the plagiarism/AI
// thresholds in ProgramConfig. Tune via env once real scores are visible.
const SIMILARITY_FLAG = Number(process.env.SIMILARITY_FLAG_THRESHOLD ?? 85);
const SIMILARITY_REJECT = Number(process.env.SIMILARITY_REJECT_THRESHOLD ?? 95);

const TITLE_MAX_LENGTH = 200;
const ABSTRACT_MIN_WORDS = 250;
const ABSTRACT_MAX_WORDS = 500;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Students see their scores, not which other teams' projects they matched.
function forStudent(contentCheck) {
  if (!contentCheck) return contentCheck;
  const { similarProjects, ...rest } = contentCheck.toObject?.() ?? contentCheck;
  return rest;
}

async function findStudentProject(studentId) {
  const project = await Project.findOne({ students: studentId }).populate(
    "students",
    "name regNo emailId"
  );

  if (!project) {
    const err = new Error("No project found for this student.");
    err.statusCode = 404;
    throw err;
  }

  return project;
}

export class TitleAbstractService {
  /**
   * Submit (or re-submit) the team's title/abstract. Any one teammate submits
   * for the whole team: it goes straight to the plagiarism/AI/similarity check,
   * then to guide review. Blocked while under review or once accepted.
   */
  static async submitTitleAbstract(studentId, { title, abstract }) {
    if (!title || !title.trim()) {
      const err = new Error("Title is required.");
      err.statusCode = 400;
      throw err;
    }

    if (title.length > TITLE_MAX_LENGTH) {
      const err = new Error(
        `Title must be at most ${TITLE_MAX_LENGTH} characters.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (!abstract || !abstract.trim()) {
      const err = new Error("Abstract is required.");
      err.statusCode = 400;
      throw err;
    }

    const count = wordCount(abstract);
    if (count < ABSTRACT_MIN_WORDS || count > ABSTRACT_MAX_WORDS) {
      const err = new Error(
        `Abstract must be between ${ABSTRACT_MIN_WORDS} and ${ABSTRACT_MAX_WORDS} words (currently ${count}).`
      );
      err.statusCode = 400;
      throw err;
    }

    const project = await findStudentProject(studentId);

    if (!project.students.some((s) => s._id.equals(studentId))) {
      const err = new Error("You are not a member of this project.");
      err.statusCode = 403;
      throw err;
    }

    if (project.titleAbstractStatus === "accepted") {
      const err = new Error(
        "This project's title and abstract have already been accepted and locked."
      );
      err.statusCode = 409;
      throw err;
    }

    if (project.titleAbstractStatus === "pending_review") {
      const err = new Error(
        "Your team has already submitted a title and abstract; it is awaiting your guide's review."
      );
      err.statusCode = 409;
      throw err;
    }

    // One teammate submits for the whole team; it goes straight to the content check.
    const confirmedTitle = title.trim();
    const confirmedAbstract = abstract.trim();

    project.titleAbstractHistory.push({
      action: "submitted",
      title: confirmedTitle,
      abstract: confirmedAbstract,
      performedBy: studentId,
      performedByModel: "Student",
    });

    // Duplicate-project check against approved projects only. The submission
    // itself is not stored for comparison until the guide accepts it. A model
    // failure must not block submission: it degrades to "not checked".
    let similarity = { similarityScore: null, similarProjects: [] };
    try {
      similarity = await checkSimilarity(confirmedTitle, confirmedAbstract, project._id);
    } catch (error) {
      logger.error("similarity_check_failed", {
        projectId: project._id,
        error: error.message,
      });
    }
    const { similarityScore, similarProjects } = similarity;
    const similarityRejected = similarityScore !== null && similarityScore >= SIMILARITY_REJECT;
    const similarityFlagged = similarityScore !== null && similarityScore >= SIMILARITY_FLAG;

    const config = await ProgramConfig.findOne({
      academicYear: project.academicYear,
      school: project.school,
      program: project.program,
    }).lean();

    // Plagiarism/AI scoring is opt-in per program (admin > Content Check):
    // when off, both scores stay null and play no part in flag/reject.
    const { plagiarismScore, aiScore } = config?.plagiarismCheckEnabled
      ? await PlagiarismService.checkContent(confirmedAbstract)
      : { plagiarismScore: null, aiScore: null };

    const flagThreshold = config?.flagThreshold ?? 60;
    const autoRejectThreshold = config?.autoRejectThreshold ?? 85;
    const highestScore = plagiarismScore === null ? null : Math.max(plagiarismScore, aiScore);
    const rejected =
      (highestScore !== null && highestScore > autoRejectThreshold) || similarityRejected;
    const flagged =
      !rejected && ((highestScore !== null && highestScore > flagThreshold) || similarityFlagged);

    project.contentCheck = {
      plagiarismScore,
      aiScore,
      similarityScore,
      similarProjects,
      checkedAt: new Date(),
      flagged,
      rejected,
    };

    if (rejected) {
      // Auto-rejected: do not advance to guide review. Students see the scores
      // and rejection reason, and any teammate may revise + resubmit (the form
      // is prefilled from the last submission, see getStatus).
      project.titleAbstractStatus = "rejected";
      project.titleAbstractHistory.push({
        action: "rejected",
        title: confirmedTitle,
        abstract: confirmedAbstract,
        performedBy: studentId,
        performedByModel: "Student",
      });

      await project.save();

      logger.info("title_abstract_auto_rejected", {
        projectId: project._id,
        plagiarismScore,
        aiScore,
        similarityScore,
        autoRejectThreshold,
      });

      return {
        status: project.titleAbstractStatus,
        contentCheck: forStudent(project.contentCheck),
      };
    }

    project.proposedTitle = confirmedTitle;
    project.proposedAbstract = confirmedAbstract;
    project.titleAbstractStatus = "pending_review";
    project.titleAbstractHistory.push({
      action: "consensus_reached",
      title: confirmedTitle,
      abstract: confirmedAbstract,
      performedBy: studentId,
      performedByModel: "Student",
    });

    await project.save();

    logger.info("title_abstract_consensus_reached", {
      projectId: project._id,
      plagiarismScore,
      aiScore,
      similarityScore,
      flagged,
    });

    return {
      status: project.titleAbstractStatus,
      proposedTitle: confirmedTitle,
      proposedAbstract: confirmedAbstract,
      contentCheck: forStudent(project.contentCheck),
    };
  }

  /**
   * Get the current title/abstract workflow state for a student's project.
   */
  static async getStatus(studentId) {
    const project = await findStudentProject(studentId);

    // The team's latest submission, whoever made it — prefills the form for
    // every teammate and shows who submitted.
    const last = project.titleAbstractHistory.findLast((h) => h.action === "submitted");
    const submitter = last && project.students.find((s) => s._id.equals(last.performedBy));

    return {
      status: project.titleAbstractStatus,
      mySubmission: last
        ? {
            title: last.title,
            abstract: last.abstract,
            submittedAt: last.performedAt,
            submittedBy: submitter ? { name: submitter.name, regNo: submitter.regNo } : null,
          }
        : null,
      proposedTitle: project.proposedTitle,
      proposedAbstract: project.proposedAbstract,
      title: project.name,
      abstract: project.abstract,
      contentCheck: ["pending_review", "accepted", "rejected"].includes(
        project.titleAbstractStatus
      )
        ? forStudent(project.contentCheck)
        : null,
      acceptedAt: project.titleAbstractAcceptedAt,
    };
  }

  /**
   * Guide accepts the consensus title/abstract, locking it permanently.
   */
  static async acceptTitleAbstract(projectId, guideFacultyId) {
    const project = await Project.findById(projectId);

    if (!project) {
      const err = new Error("Project not found.");
      err.statusCode = 404;
      throw err;
    }

    if (!project.guideFaculty.equals(guideFacultyId)) {
      const err = new Error(
        "Only the assigned guide may accept this project's title and abstract."
      );
      err.statusCode = 403;
      throw err;
    }

    if (project.titleAbstractStatus !== "pending_review") {
      const err = new Error(
        `Cannot accept — current status is "${project.titleAbstractStatus}", expected "pending_review".`
      );
      err.statusCode = 409;
      throw err;
    }

    project.name = project.proposedTitle;
    project.abstract = project.proposedAbstract;
    project.description = project.proposedAbstract;
    project.titleAbstractStatus = "accepted";
    project.titleAbstractAcceptedBy = guideFacultyId;
    project.titleAbstractAcceptedAt = new Date();
    project.titleAbstractHistory.push({
      action: "accepted",
      title: project.name,
      abstract: project.abstract,
      performedBy: guideFacultyId,
      performedByModel: "Faculty",
    });

    await project.save();

    // Approved title/abstract joins the corpus later submissions are compared
    // against. Not fatal: the backfill embeds any project left without one.
    try {
      await Project.updateOne(
        { _id: project._id },
        { abstractEmbedding: await embed(embeddingText(project.name, project.abstract)) }
      );
    } catch (error) {
      logger.error("accept_embedding_failed", { projectId: project._id, error: error.message });
    }

    logger.info("title_abstract_accepted", {
      projectId: project._id,
      guideFacultyId,
    });

    return project;
  }
}
