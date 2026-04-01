import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import bcrypt from "bcryptjs";

import Faculty from "../../models/facultySchema.js";
import Student from "../../models/studentSchema.js";
import Project from "../../models/projectSchema.js";
import Panel from "../../models/panelSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const EXCEL_PATHS = {
  faculty: path.join(__dirname, "Faculty_Template_Updated_multi.xlsx"),
  projects: path.join(__dirname, "Projects_Template(6).xlsx"),
  panels: path.join(__dirname, "panel_upload_filled_updated (1).xlsx"),
  panelAssignments: path.join(__dirname, "Project_Panel_Assignments_updated (3).xlsx"),
};

const DEFAULTS = {
  academicYear: "2025-2026 WINTER",
  school: "MULTI",
  program: "MD",
};

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

// ================= HELPERS =================

function readSheet(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Excel file not found: '${filePath}'`);
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

function str(val) {
  return val != null ? String(val).trim() : "";
}

// ================= 1. FACULTY =================

async function uploadFaculty() {
  const rows = readSheet(EXCEL_PATHS.faculty);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const employeeId = str(row["employeeId"]).toUpperCase();
    const name = str(row["name"]);
    const emailId = str(row["emailId"]).toLowerCase();
    const phoneNumber = str(row["phoneNumber"]);
    const password = str(row["password"]);

    if (!employeeId || !name || !emailId || !phoneNumber || !password) continue;

    const existing = await Faculty.findOne({
      $or: [{ employeeId }, { emailId }],
    });

    if (existing) continue;

    const hashedPassword = await bcrypt.hash(password, 10);

    await Faculty.create({
      name,
      emailId,
      employeeId,
      phoneNumber,
      password: hashedPassword,
      role: "faculty",
      school: DEFAULTS.school,
      program: [DEFAULTS.program],
      isActive: true,
    });
  }
}

// ================= 2. PROJECTS =================

async function uploadProjects() {
  const rows = readSheet(EXCEL_PATHS.projects);

  for (let row of rows) {
    const name = str(row["name"]);
    const guideEmpId = str(row["guideFacultyEmpId"]).toUpperCase();
    const teamMembersStr = str(row["teamMembers"]);

    if (!name || !guideEmpId || !teamMembersStr) continue;

    const guide = await Faculty.findOne({ employeeId: guideEmpId });
    if (!guide) continue;

    const regNos = teamMembersStr
      .split(/[,\s;]+/)
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);

    const students = await Student.find({
      regNo: { $in: regNos },
    });

    if (!students.length) continue;

    const existing = await Project.findOne({
      name: name.trim(),
      academicYear: DEFAULTS.academicYear,
      status: { $ne: "archived" },
    });

    if (existing) continue;

    await Project.create({
      name: name.trim(),
      guideFaculty: guide._id,
      students: students.map((s) => s._id),
      teamSize: students.length,
      academicYear: DEFAULTS.academicYear,
      school: DEFAULTS.school,
      program: DEFAULTS.program,
      status: "active",
    });
  }
}

// ================= 3. PANELS =================

async function uploadPanels() {
  const rows = readSheet(EXCEL_PATHS.panels);

  for (let row of rows) {
    const panelName = str(row["Panel Name"]);

    const facultyEmpIds = [
      str(row["Faculty Employee ID 1"]).toUpperCase(),
      str(row["Faculty Employee ID 2"]).toUpperCase(),
      str(row["Faculty Employee ID 3"]).toUpperCase(),
    ].filter(Boolean);

    if (!panelName || !facultyEmpIds.length) continue;

    const existing = await Panel.findOne({
      panelName: panelName.trim(),
      academicYear: DEFAULTS.academicYear,
    });

    if (existing) continue;

    const faculties = await Faculty.find({
      employeeId: { $in: facultyEmpIds },
    });

    if (faculties.length !== facultyEmpIds.length) continue;

    await Panel.create({
      panelName: panelName.trim(),
      members: faculties.map((f) => ({
        faculty: f._id,
        facultyEmployeeId: f.employeeId,
      })),
      facultyEmployeeIds: faculties.map((f) => f.employeeId),
      academicYear: DEFAULTS.academicYear,
      school: DEFAULTS.school,
      program: DEFAULTS.program,
      isActive: true,
    });
  }
}

// ================= 4. PANEL ASSIGNMENTS =================

async function uploadPanelAssignments() {
  const rows = readSheet(EXCEL_PATHS.panelAssignments);

  for (let row of rows) {
    const projectTitle = str(row["ProjectTitle"]);
    const studentRegNo = str(row["StudentRegNo"]).toUpperCase();
    const panelName = str(row["PanelName"]);

    let project = null;

    if (projectTitle) {
      project = await Project.findOne({
        name: projectTitle.trim(),
        status: "active",
      });
    }

    if (!project && studentRegNo) {
      const student = await Student.findOne({ regNo: studentRegNo });
      if (!student) continue;

      project = await Project.findOne({
        students: student._id,
        status: "active",
      });
    }

    if (!project) continue;

    const panel = await Panel.findOne({
      panelName: panelName.trim(),
      isActive: true,
    });

    if (!panel) continue;

    project.panel = panel._id;
    await project.save();
  }
}

// ================= MAIN =================

async function main() {
  await mongoose.connect(MONGO_URI);

  await uploadFaculty();
  await uploadProjects();
  await uploadPanels();
  await uploadPanelAssignments();

  await mongoose.disconnect();
}

main();
