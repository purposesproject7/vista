import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Marks from "../models/marksSchema.js";
import MasterData from "../models/masterDataSchema.js";
import ActivityLog from "../models/activityLogSchema.js";
import ActivityLogService from "../services/activityLogService.js";
import { ReportService } from "../services/reportService.js";
import * as XLSX from "xlsx";
import { openDb, hashedPassword, startServer, call, shutdown } from "./harness.js";

const YEAR = "Fall Semester 2099-2100";
const SCHOOL = "Report Test School";
const PROGRAMS = [
  ["IDP", "IDP"], ["B.Tech", "B.TECH"],
  ["M.Tech Software Engineering", "M.TECH SW(INTEGRATED)"],
  ["M.TECH(2 yrs)", "M.TECH(2 YEAR)"], ["MCA(II Year)", "MCA"],
];
const teams = [];
let guide;
let password;

before(async () => {
  await openDb();
  password = await hashedPassword();
  guide = await Faculty.create({
    name: "Shared guide", emailId: "reportguide@reporttest.local", employeeId: "REPORT_GUIDE",
    phoneNumber: "9000000000", password, school: SCHOOL, program: ["IDP"], role: "faculty",
  });
  await Faculty.create({
    name: "School admin", emailId: "reportadmin@reporttest.local", employeeId: "REPORT_ADMIN",
    phoneNumber: "9000000000", password, school: SCHOOL, role: "admin",
  });
  await MasterData.create({
    schools: [{ name: SCHOOL, code: "REPORT" }, { name: "Other school", code: "OTHER" }],
    programs: [...PROGRAMS.map(([name, code]) => ({ school: "REPORT", name, code })), { school: "OTHER", name: "B.Tech", code: "B.TECH" }],
    academicYears: [{ year: YEAR }, { year: "Prior Year" }],
  });
  for (const [program, code] of PROGRAMS) {
    const ctx = { school: SCHOOL, program, academicYear: YEAR };
    const student = await Student.create({
      name: program, regNo: `REPORT_${teams.length}`, emailId: `report${teams.length}@reporttest.local`, password, ...ctx,
    });
    const panel = await Panel.create({
      panelName: `${program} Panel`, members: [{ faculty: guide._id }], ...ctx,
    });
    const project = await Project.create({
      name: `${program} Team`, students: [student._id], guideFaculty: guide._id,
      panel: panel._id, type: "software", teamSize: 1, ...ctx,
    });
    // Reproduce production: all programmes' historical marks/logs carry IDP.
    const mark = await Marks.create({
      student: student._id, project: project._id, faculty: guide._id,
      facultyType: "guide", reviewType: "Review 1", totalMarks: 40, maxTotalMarks: 50,
      isSubmitted: true, ...ctx, program: "IDP",
    });
    await ActivityLog.create({
      faculty: guide._id, action: "MARK_ENTRY", school: SCHOOL, program: "IDP", academicYear: "Unknown",
      details: { targetId: mark._id, targetModel: "Marks", description: "Historical mark entry" },
    });
    teams.push({ program, code, student, panel, project, mark });
  }
  // A different year's student must not enter this year's marks or activity report.
  const prior = await Student.create({
    name: "Prior student", regNo: "REPORT_PRIOR", emailId: "prior@reporttest.local", password,
    school: SCHOOL, program: "B.Tech", academicYear: "Prior Year",
  });
  const priorMark = await Marks.create({
    student: prior._id, project: teams[1].project._id, faculty: guide._id,
    facultyType: "panel", reviewType: "Review 1", totalMarks: 10, maxTotalMarks: 50,
    isSubmitted: true, school: SCHOOL, program: "IDP", academicYear: "Prior Year",
  });
  await ActivityLog.create({
    faculty: guide._id, action: "MARK_ENTRY", school: SCHOOL, program: "IDP", academicYear: "Unknown",
    details: { targetId: priorMark._id, targetModel: "Marks" },
  });
  await Student.create({
    name: "Other school student", regNo: "REPORT_OTHER_SCHOOL", emailId: "other@reporttest.local", password,
    school: "Other school", program: "B.Tech", academicYear: YEAR,
  });
  await startServer(5096, [guide.emailId, "reportadmin@reporttest.local"]);
});

after(shutdown);

const filters = programme => ({ school: "REPORT", programme, year: YEAR });

test("all twelve reports include every programme through its name and code", async () => {
  const rowReports = [
    "student-marks-range", "panel-marks-entry", "guide-student-list", "comprehensive-marks",
    "faculty-workload", "student-complete-details", "team-details", "ppt-approval-status",
  ];
  for (const team of teams) {
    for (const value of [team.program, team.code]) {
      for (const type of rowReports) {
        const data = await ReportService.generateReport(type, filters(value));
        assert.equal(data.length, 1, `${type}: ${value}`);
        if (type === "student-marks-range") assert.equal(data[0].regNo, team.student.regNo);
        if (type === "faculty-workload") {
          assert.equal(data[0].projectsGuided, 1);
          assert.equal(data[0].panelsAssigned, 1);
        }
      }
      const master = await ReportService.generateReport("master-report", filters(value));
      for (const collection of ["students", "faculty", "projects", "marks", "panels"]) {
        assert.equal(master[collection].length, 1, `${collection}: ${value}`);
      }
      assert.equal(master.marks[0].program, team.program);
      const pending = await ReportService.generateReport("pending-marks", { ...filters(value), status: "panel-pending" });
      assert.equal(pending.length, 1, `pending: ${value}`);
      assert.equal(pending[0].pendingStatus, "Panel Pending");
      const distribution = await ReportService.generateReport("marks-distribution", filters(value));
      assert.equal(distribution.reduce((n, row) => n + row.count, 0), 1);
      assert.equal(distribution.find(row => row.range === "61-80%").count, 1);
      const activities = await ReportService.generateReport("faculty-time-sheet", filters(value));
      assert.equal(activities.logs.length, 1, `activities: ${value}`);
      assert.equal(activities.logs[0].program, team.program);
    }
  }
});

test("filter values treat punctuation literally and preserve the selected school/year", async () => {
  assert.equal((await ReportService.generateReport("comprehensive-marks", filters("M.TECH(2 yrs)"))).length, 1);
  for (const override of [{ school: "Other school" }, { year: "Other year" }, { programme: "M.*" }]) {
    assert.deepEqual(await ReportService.generateReport("student-marks-range", { ...filters("B.Tech"), ...override }), []);
  }
  const data = await ReportService.generateReport("comprehensive-marks", filters(" b.tech "));
  assert.equal(data[0].regNo, teams[1].student.regNo);
});

test("new marks use the student's context even when the guide only lists IDP", async () => {
  const team = teams[1];
  const res = await call("reportguide", "POST", "/faculty/marks", {
    student: team.student._id, project: team.project._id, reviewType: "Review 2",
    componentMarks: [{
      componentId: new mongoose.Types.ObjectId(), componentName: "Evaluation",
      componentTotal: 25, componentMaxTotal: 50,
    }], totalMarks: 25, maxTotalMarks: 50,
  });
  assert.equal(res.status, 201, res.body.message);
  assert.equal(res.body.data.program, "B.Tech");
  assert.equal(res.body.data.school, SCHOOL);
  assert.equal(res.body.data.academicYear, YEAR);
  // Logging runs after the response, so wait for its observable database result.
  let activity;
  for (let i = 0; i < 30 && !activity; i++) {
    activity = await ActivityLog.findOne({ "details.targetId": res.body.data._id });
    if (!activity) await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(activity?.program, "B.Tech");
  assert.equal(activity?.academicYear, YEAR);
});

test("updating an old mark corrects its programme and logs the real year", async () => {
  const team = teams[1];
  const res = await call("reportguide", "PUT", `/faculty/marks/${team.mark._id}`, { totalMarks: 35, maxTotalMarks: 50, componentMarks: [{ componentId: new mongoose.Types.ObjectId(), componentName: "Eval", componentTotal: 35, componentMaxTotal: 50 }] });
  assert.equal(res.status, 200, res.body.message);
  assert.equal(res.body.data.program, "B.Tech");
  assert.equal(res.body.data.academicYear, YEAR);
});

test("PPT and draft approval activities use the student's programme and year", async () => {
  const team = teams[1];
  for (const approval of ["ppt", "draft"]) {
    const res = await call("reportguide", "POST", `/faculty/approvals/${approval}`, {
      studentId: team.student._id, reviewType: "Review 2",
    });
    assert.equal(res.status, 200, res.body.message);
  }
  let activities = [];
  for (let i = 0; i < 30 && activities.length < 2; i++) {
    activities = await ActivityLog.find({ "details.targetId": team.student._id, "details.targetModel": "Student" });
    if (activities.length < 2) await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(activities.length, 2);
  assert.ok(activities.every(log => log.program === "B.Tech" && log.academicYear === YEAR));
  const report = await ReportService.generateReport("faculty-time-sheet", filters("B.Tech"));
  for (const action of ["PPT_APPROVAL", "DRAFT_APPROVAL"]) {
    assert.ok(report.logs.some(log => log.action === action));
  }
});

test("activity filters accept both year spellings and exclude historical Unknown-year logins", async () => {
  await ActivityLogService.logActivity(guide._id, "LOGIN", { school: SCHOOL, program: "B.Tech", academicYear: "Unknown" });
  for (const key of ["year", "academicYear"]) {
    const data = await ActivityLogService.getTimeSheetData({ school: [SCHOOL], programme: ["B.Tech"], [key]: YEAR });
    assert.ok(data.length > 0);
    assert.ok(data.every(row => row.action !== "LOGIN"));
  }
});

test("a school admin's master export cannot include another school's records", async () => {
  for (const extra of ["", "&school=Other%20school"]) {
    const res = await call("reportadmin", "GET", `/admin/reports?type=master-report${extra}`);
    assert.equal(res.status, 200, res.body.message);
    assert.ok(res.body.data.students.length > 0);
    assert.ok(res.body.data.students.every(student => student.school === SCHOOL));
  }
});

test("B.Tech data survives the same Excel serialization used by the report page", async () => {
  const data = await ReportService.generateReport("comprehensive-marks", filters("B.Tech"));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "Report Data");
  const downloaded = XLSX.read(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(downloaded.Sheets["Report Data"]);
  assert.ok(rows.length > 0);
  assert.ok(rows.every(row => row.regNo === teams[1].student.regNo));
  assert.ok(rows.some(row => row.guideMarks === 35));
});

test("the separate admin marks/workload APIs include historical marks and assigned guides", async () => {
  const query = new URLSearchParams({ school: SCHOOL, program: "B.TECH", academicYear: YEAR });
  const marks = await call("reportadmin", "GET", `/admin/reports/marks?${query}`);
  assert.equal(marks.status, 200, marks.body.message);
  assert.ok(marks.body.data.length > 0);
  assert.ok(marks.body.data.every(row => row.student.regNo === teams[1].student.regNo));
  const workload = await call("reportadmin", "GET", `/admin/reports/faculty-workload?${query}`);
  assert.equal(workload.status, 200, workload.body.message);
  assert.equal(workload.body.data.length, 1);
  assert.equal(workload.body.data[0].guidedProjects, 1);
  assert.equal(workload.body.data[0].marks.submitted, 2);
});
