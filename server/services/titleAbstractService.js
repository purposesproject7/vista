import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { PlagiarismService } from "./plagiarismService.js";
import { logger } from "../utils/logger.js";

const TITLE_MAX_LENGTH = 200;
const ABSTRACT_MIN_WORDS = 250;
const ABSTRACT_MAX_WORDS = 500;

function normalize(text) {
  return text
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function findStudentProject(studentId) {
  const project = await Project.findOne({ students: studentId }).populate(
    "students",
    "name regNo emailId titleAbstractSubmission"
  );

  if (!project) {
    const err = new Error("No project found for this student.");
    err.statusCode = 404;
    throw err;
  }

  return project;
}

export class TitleAbstractService {
  static normalize = normalize;

  /**
   * Submit (or re-submit) a student's proposed title/abstract. Once every
   * teammate has submitted, compares the normalized values across the team:
   * a match advances the project to plagiarism/AI review, a mismatch surfaces
   * a discrepancy for the team to resolve.
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

    await Student.findByIdAndUpdate(studentId, {
      titleAbstractSubmission: {
        title: title.trim(),
        abstract: abstract.trim(),
        submittedAt: new Date(),
      },
    });

    project.titleAbstractHistory.push({
      action: "submitted",
      title: title.trim(),
      abstract: abstract.trim(),
      performedBy: studentId,
      performedByModel: "Student",
    });

    // Reload teammates' submissions (including the one just written)
    const teammates = await Student.find({
      _id: { $in: project.students.map((s) => s._id) },
    }).select("titleAbstractSubmission name regNo");

    const allSubmitted = teammates.every((s) => s.titleAbstractSubmission?.title);

    if (!allSubmitted) {
      project.titleAbstractStatus = "pending_consensus";
      await project.save();
      return {
        status: project.titleAbstractStatus,
        waitingOn: teammates
          .filter((s) => !s.titleAbstractSubmission?.title)
          .map((s) => ({ name: s.name, regNo: s.regNo })),
      };
    }

    const normalizedTitles = teammates.map((s) =>
      normalize(s.titleAbstractSubmission.title)
    );
    const normalizedAbstracts = teammates.map((s) =>
      normalize(s.titleAbstractSubmission.abstract)
    );

    const titlesMatch = normalizedTitles.every((t) => t === normalizedTitles[0]);
    const abstractsMatch = normalizedAbstracts.every(
      (a) => a === normalizedAbstracts[0]
    );

    if (!titlesMatch || !abstractsMatch) {
      project.titleAbstractStatus = "discrepancy";
      project.titleAbstractHistory.push({
        action: "discrepancy",
        performedBy: studentId,
        performedByModel: "Student",
      });
      await project.save();
      return {
        status: project.titleAbstractStatus,
        submissions: teammates.map((s) => ({
          name: s.name,
          regNo: s.regNo,
          title: s.titleAbstractSubmission.title,
          abstract: s.titleAbstractSubmission.abstract,
        })),
      };
    }

    // Consensus reached — run the content check and hand off to the guide
    const confirmedTitle = teammates[0].titleAbstractSubmission.title;
    const confirmedAbstract = teammates[0].titleAbstractSubmission.abstract;

    const { plagiarismScore, aiScore } = await PlagiarismService.checkContent(
      confirmedAbstract
    );

    const config = await ProgramConfig.findOne({
      academicYear: project.academicYear,
      school: project.school,
      program: project.program,
    }).lean();

    const plagiarismThreshold = config?.plagiarismThreshold ?? 60;
    const aiThreshold = config?.aiThreshold ?? 60;
    const flagged = plagiarismScore > plagiarismThreshold || aiScore > aiThreshold;

    project.proposedTitle = confirmedTitle;
    project.proposedAbstract = confirmedAbstract;
    project.contentCheck = {
      plagiarismScore,
      aiScore,
      checkedAt: new Date(),
      flagged,
    };
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
      flagged,
    });

    return {
      status: project.titleAbstractStatus,
      proposedTitle: confirmedTitle,
      proposedAbstract: confirmedAbstract,
      contentCheck: project.contentCheck,
    };
  }

  /**
   * Get the current title/abstract workflow state for a student's project.
   */
  static async getStatus(studentId) {
    const project = await findStudentProject(studentId);
    const student = await Student.findById(studentId).select(
      "titleAbstractSubmission"
    );

    return {
      status: project.titleAbstractStatus,
      mySubmission: student.titleAbstractSubmission || null,
      proposedTitle: project.proposedTitle,
      proposedAbstract: project.proposedAbstract,
      title: project.name,
      abstract: project.abstract,
      contentCheck:
        project.titleAbstractStatus === "pending_review" ||
        project.titleAbstractStatus === "accepted"
          ? project.contentCheck
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

    logger.info("title_abstract_accepted", {
      projectId: project._id,
      guideFacultyId,
    });

    return project;
  }
}
