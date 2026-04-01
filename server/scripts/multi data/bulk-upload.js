import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Resolve __dirname for ES modules (works regardless of where `node` is invoked from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bcrypt from "bcryptjs";
import Faculty from "../../models/facultySchema.js";
import Student from "../../models/studentSchema.js";
import Project from "../../models/projectSchema.js";
import Panel from "../../models/panelSchema.js";

// Load environment variables
dotenv.config();

// ============================================================================
// ⚙️  CONFIGURATION — Update these paths before running
// ============================================================================

const EXCEL_PATHS = {
  faculty: path.join(__dirname, "Faculty_Template_Updated_multi.xlsx"),          // Columns: employeeId, name, emailId, phoneNumber, specialization, password, role
  projects: path.join(__dirname, "Projects_Template(6).xlsx"),              // Columns: name, guideFacultyEmpId, teamMembers, type, specialization
  panels: path.join(__dirname, "panel_upload_filled_updated (1).xlsx"),   // Columns: Panel Name, Faculty Employee ID 1, Faculty Employee ID 2, Faculty Employee ID 3, Specializations
  panelAssignments: path.join(__dirname, "Project_Panel_Assignments_updated (3).xlsx"), // Columns: ProjectTitle, StudentRegNo, PanelName
};

// Defaults applied to every project and panel row (change as needed)
const DEFAULTS = {
  academicYear: "2025-2026 WINTER",
  school: "MULTI",
  program: "MD",
};

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

// ============================================================================
// HELPERS
// ============================================================================

function readSheet(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: '${filePath}'`);
  }
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

function str(val) {
  return val != null ? String(val).trim() : "";
}

function printDivider(label) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(60));
}

function printResults({ label, total, success, failed, errors }) {
  console.log(`\n--- ${label} ---`);
  console.log(`  Total:   ${total}`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed:  ${failed}`);
  if (errors.length > 0) {
    console.log("  Errors:");
    errors.forEach((e) => console.error(`    • ${e}`));
  }
}

// ============================================================================
// 1. FACULTY UPLOAD
// ============================================================================
// Required columns: employeeId, name, emailId, phoneNumber, specialization, password, role

async function uploadFaculty() {
  printDivider("1 / 4 — Faculty Upload");

  let rows;
  try {
    rows = readSheet(EXCEL_PATHS.faculty);
    console.log(`  Found ${rows.length} rows in faculty sheet.`);
  } catch (err) {
    console.warn(`  [SKIPPED] ${err.message}`);
    return;
  }

  const results = { label: "Faculty", total: rows.length, success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const employeeId = str(row["employeeId"] || row["EmployeeId"] || row["Employee ID"]);
    const name = str(row["name"] || row["Name"]);
    const emailId = str(row["emailId"] || row["Email"] || row["email"]);
    const phoneNumber = str(row["phoneNumber"] || row["Phone"] || row["phone"]);
    const specialization = str(row["specialization"] || row["Specialization"]);
    const password = str(row["password"] || row["Password"]);
    const role = str(row["role"] || row["Role"]) || "faculty";

    if (!employeeId || !name || !emailId || !phoneNumber || !password) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: Missing required field(s) — employeeId, name, emailId, phoneNumber, or password.`);
      continue;
    }

    try {
      // Check duplicate (employeeId and email only — phone duplicates are allowed)
      const existing = await Faculty.findOne({
        $or: [
          { employeeId: employeeId.toUpperCase() },
          { emailId: emailId.toLowerCase() },
        ],
      });

      if (existing) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Duplicate — faculty with employeeId '${employeeId}' or email '${emailId}' already exists. Skipping.`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const faculty = new Faculty({
        name,
        emailId: emailId.toLowerCase(),
        employeeId: employeeId.toUpperCase(),
        phoneNumber,
        password: hashedPassword,
        role: role.toLowerCase() === "admin" ? "admin" : "faculty",
        school: DEFAULTS.school,
        program: [DEFAULTS.program],
        specialization,
        isActive: true,
      });

      await faculty.save();
      console.log(`  [Row ${rowNum}] ✓ Created faculty: ${name} (${employeeId})`);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${rowNum} (${employeeId}): ${err.message}`);
    }
  }

  printResults(results);
}

// ============================================================================
// 2. PROJECT UPLOAD
// ============================================================================
// Required columns: name, guideFacultyEmpId, teamMembers, type, specialization

async function uploadProjects() {
  printDivider("2 / 4 — Project Upload");

  let rows;
  try {
    rows = readSheet(EXCEL_PATHS.projects);
    console.log(`  Found ${rows.length} rows in projects sheet.`);
  } catch (err) {
    console.warn(`  [SKIPPED] ${err.message}`);
    return;
  }

  const results = { label: "Projects", total: rows.length, success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const name = str(row["name"] || row["Name"]);
    const guideEmpId = str(row["guideFacultyEmpId"] || row["Guide Faculty Emp ID"] || row["GuideEmpId"]);
    const teamMembersStr = str(row["teamMembers"] || row["Team Members"] || row["TeamMembers"]);
    const type = str(row["type"] || row["Type"]) || "software";
    const specialization = str(row["specialization"] || row["Specialization"]);

    if (!name || !guideEmpId || !teamMembersStr) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: Missing required field(s) — name, guideFacultyEmpId, or teamMembers.`);
      continue;
    }

    try {
      // Look up guide faculty
      const guide = await Faculty.findOne({ employeeId: { $regex: new RegExp(`^${guideEmpId}$`, "i") } });
      if (!guide) {
        throw new Error(`Guide faculty '${guideEmpId}' not found.`);
      }

      // Parse team members (comma/space/semicolon separated reg numbers)
      const regNos = teamMembersStr
        .split(/[,\s;]+/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      if (regNos.length === 0) {
        throw new Error("No valid student reg numbers parsed from teamMembers.");
      }

      // Look up students
      const studentDocs = await Student.find({
        regNo: { $in: regNos.map((r) => new RegExp(`^${r}$`, "i")) },
      });

      if (studentDocs.length === 0) {
        throw new Error(`No students found for reg numbers: ${regNos.join(", ")}`);
      }

      const studentIds = studentDocs.map((s) => s._id);
      const normalizedType = type.toLowerCase().trim();

      // Check for duplicate project name in same academic year
      const existing = await Project.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        academicYear: DEFAULTS.academicYear,
        status: { $ne: "archived" },
      });

      if (existing) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Project '${name}' already exists for ${DEFAULTS.academicYear}. Skipping.`);
        continue;
      }

      const project = new Project({
        name: name.trim(),
        guideFaculty: guide._id,
        students: studentIds,
        teamSize: studentIds.length,
        academicYear: DEFAULTS.academicYear,
        school: DEFAULTS.school,
        program: DEFAULTS.program,
        specialization,
        type: ["hardware", "software"].includes(normalizedType) ? normalizedType : "software",
        status: "active",
        history: [
          {
            action: "created",
            performedBy: guide._id,
            performedAt: new Date(),
          },
        ],
      });

      await project.save();
      console.log(`  [Row ${rowNum}] ✓ Created project: "${name}" (Guide: ${guideEmpId}, Students: ${regNos.join(", ")})`);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${rowNum} (${name}): ${err.message}`);
    }
  }

  printResults(results);
}

// ============================================================================
// 3. PANEL UPLOAD
// ============================================================================
// Required columns: Panel Name, Faculty Employee ID 1, Faculty Employee ID 2, Faculty Employee ID 3, Specializations

async function uploadPanels() {
  printDivider("3 / 4 — Panel Upload");

  let rows;
  try {
    rows = readSheet(EXCEL_PATHS.panels);
    console.log(`  Found ${rows.length} rows in panels sheet.`);
  } catch (err) {
    console.warn(`  [SKIPPED] ${err.message}`);
    return;
  }

  const results = { label: "Panels", total: rows.length, success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const panelName = str(row["Panel Name"] || row["panelName"] || row["PanelName"]);

    // Collect all faculty IDs (columns: Faculty Employee ID 1/2/3 / or however many columns)
    const facultyEmpIds = [
      str(row["Faculty Employee ID 1"] || row["FacultyEmpId1"] || row["EmpId1"]),
      str(row["Faculty Employee ID 2"] || row["FacultyEmpId2"] || row["EmpId2"]),
      str(row["Faculty Employee ID 3"] || row["FacultyEmpId3"] || row["EmpId3"]),
    ].filter((id) => id.length > 0);

    // Also support a single "Faculty Employee IDs" (comma-separated) column
    const combinedIds = str(row["Faculty Employee IDs"] || row["FacultyEmployeeIDs"]);
    if (combinedIds) {
      const parsed = combinedIds.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      facultyEmpIds.push(...parsed);
    }

    const specializations = str(row["Specializations"] || row["Specialization"] || row["specializations"])
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!panelName || facultyEmpIds.length === 0) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: Missing Panel Name or at least one Faculty Employee ID.`);
      continue;
    }

    try {
      // Check for duplicate panel name
      const existing = await Panel.findOne({
        panelName: { $regex: new RegExp(`^${panelName.trim()}$`, "i") },
        academicYear: DEFAULTS.academicYear,
        school: DEFAULTS.school,
        program: DEFAULTS.program,
      });

      if (existing) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Panel '${panelName}' already exists. Skipping.`);
        continue;
      }

      // Look up faculties
      const faculties = await Faculty.find({
        employeeId: { $in: facultyEmpIds.map((id) => new RegExp(`^${id}$`, "i")) },
      });

      if (faculties.length !== facultyEmpIds.length) {
        const found = faculties.map((f) => f.employeeId);
        const missing = facultyEmpIds.filter((id) => !found.some((f) => f.toLowerCase() === id.toLowerCase()));
        throw new Error(`Faculty not found: ${missing.join(", ")}`);
      }

      const members = faculties.map((f) => ({
        faculty: f._id,
        facultyEmployeeId: f.employeeId,
        addedAt: new Date(),
      }));

      const panel = new Panel({
        panelName: panelName.trim(),
        members,
        facultyEmployeeIds: faculties.map((f) => f.employeeId),
        academicYear: DEFAULTS.academicYear,
        school: DEFAULTS.school,
        program: DEFAULTS.program,
        specializations,
        type: "regular",
        panelType: "regular",
        maxProjects: 10,
        assignedProjectsCount: 0,
        isActive: true,
      });

      await panel.save();
      console.log(`  [Row ${rowNum}] ✓ Created panel: "${panelName}" (Members: ${facultyEmpIds.join(", ")})`);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${rowNum} (${panelName}): ${err.message}`);
    }
  }

  printResults(results);
}

// ============================================================================
// 4. PROJECT-PANEL ASSIGNMENT UPLOAD
// ============================================================================
// Required columns: ProjectTitle, StudentRegNo, PanelName

async function uploadPanelAssignments() {
  printDivider("4 / 4 — Project-Panel Assignment Upload");

  let rows;
  try {
    rows = readSheet(EXCEL_PATHS.panelAssignments);
    console.log(`  Found ${rows.length} rows in panel-assignments sheet.`);
  } catch (err) {
    console.warn(`  [SKIPPED] ${err.message}`);
    return;
  }

  // Pre-flight: fix any legacy history enums that would block saves
  try {
    const fix = await Project.updateMany(
      { "history.action": "panel_assigned" },
      { $set: { "history.$[elem].action": "panel_reassigned" } },
      { arrayFilters: [{ "elem.action": "panel_assigned" }] }
    );
    if (fix.modifiedCount > 0) {
      console.log(`  [Pre-flight] Fixed ${fix.modifiedCount} legacy 'panel_assigned' history enums.`);
    }
  } catch (err) {
    console.warn(`  [Pre-flight] Migration warning: ${err.message}`);
  }

  const results = { label: "Panel Assignments", total: rows.length, success: 0, failed: 0, errors: [] };
  const processedProjectIds = new Set(); // Avoid double-counting team members of same project
  const SYS_ADMIN_ID = new mongoose.Types.ObjectId();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    // Support both lookup strategies: by ProjectTitle directly, or by StudentRegNo
    const projectTitle = str(row["ProjectTitle"] || row["Project Title"] || row["projectTitle"]);
    const studentRegNo = str(row["StudentRegNo"] || row["Student Reg No"] || row["RegNo"]);
    const panelName = str(row["PanelName"] || row["Panel Name"] || row["panelName"]);

    if ((!projectTitle && !studentRegNo) || !panelName) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: Needs (ProjectTitle or StudentRegNo) and PanelName.`);
      continue;
    }

    try {
      let project = null;

      // Strategy 1: Look up by ProjectTitle (preferred)
      if (projectTitle) {
        project = await Project.findOne({
          name: { $regex: new RegExp(`^${projectTitle.trim()}$`, "i") },
          status: "active",
        });
      }

      // Strategy 2: Fall back to student lookup
      if (!project && studentRegNo) {
        const student = await Student.findOne({
          regNo: { $regex: new RegExp(`^${studentRegNo}$`, "i") },
        });
        if (!student) {
          console.warn(`  [Row ${rowNum}] Student '${studentRegNo}' not found — skipping.`);
          continue;
        }
        project = await Project.findOne({ students: student._id, status: "active" });
      }

      if (!project) {
        throw new Error(
          projectTitle
            ? `No active project found with title '${projectTitle}'.`
            : `No active project found for student '${studentRegNo}'.`
        );
      }

      // Skip if project was already processed in this run
      if (processedProjectIds.has(project._id.toString())) {
        console.log(`  [Row ${rowNum}] Already processed project '${project.name}' — skipping duplicate row.`);
        continue;
      }

      // Find the panel
      const panel = await Panel.findOne({
        panelName: { $regex: new RegExp(`^${panelName.trim()}$`, "i") },
        isActive: true,
      });

      if (!panel) {
        throw new Error(`Active panel '${panelName}' not found.`);
      }

      // Skip if already correctly assigned
      if (project.panel && project.panel.toString() === panel._id.toString()) {
        console.log(`  [Row ${rowNum}] Project '${project.name}' already assigned to panel '${panelName}'. Skipping.`);
        processedProjectIds.add(project._id.toString());
        continue;
      }

      // Decrement old panel count
      if (project.panel) {
        await Panel.findByIdAndUpdate(project.panel, { $inc: { assignedProjectsCount: -1 } });
      }

      // Assign new panel
      project.panel = panel._id;
      project.history.push({
        action: "panel_reassigned",
        panel: panel._id,
        performedBy: SYS_ADMIN_ID,
        performedAt: new Date(),
      });

      await project.save({ validateBeforeSave: false });

      panel.assignedProjectsCount += 1;
      await panel.save();

      processedProjectIds.add(project._id.toString());
      console.log(`  [Row ${rowNum}] ✓ Assigned panel '${panelName}' → project '${project.name}'`);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  printResults(results);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("\n🚀 Vista Bulk Upload Script");
  console.log(`   MongoDB: ${MONGO_URI.replace(/:\/\/.*@/, "://<credentials>@")}`);
  console.log(`   Defaults: ${DEFAULTS.academicYear} | ${DEFAULTS.school} | ${DEFAULTS.program}`);

  try {
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to DB.");

    await uploadFaculty();
    await uploadProjects();
    await uploadPanels();
    await uploadPanelAssignments();

    printDivider("✅ All uploads complete!");
  } catch (err) {
    console.error("\n❌ Fatal error:", err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("\nDisconnected from DB.");
    }
    process.exit(0);
  }
}

main();
