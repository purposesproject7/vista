// Feature test: a student sees when and where each of their reviews happens.
// Drives the real API as the student would. See harness.js for the database.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import { openDb, hashedPassword, startServer, call, shutdown } from "./harness.js";

const CTX = { school: "SchedTest School", program: "SchedTest Program", academicYear: "2099-2100" };
const MAIN_SLOT = new Date("2099-11-03T10:00:00Z");
const REVIEW2_SLOT = new Date("2099-10-20T04:30:00Z");
const WINDOW = { from: new Date("2099-09-01"), to: new Date("2099-09-10") };

let schedule;

before(async () => {
  await openDb();
  const password = await hashedPassword();
  const guide = await Faculty.create({
    name: "Guide", emailId: "guide@schedtest.local", employeeId: "SCHED_GUIDE",
    phoneNumber: "9000000000", password, role: "faculty", ...CTX,
  });
  const panel = (panelName, venue, dateTime) => Panel.create({ panelName, venue, dateTime, isActive: true, ...CTX });
  const mainPanel = await panel("Main Panel", "SJT 501", MAIN_SLOT);
  const review2Panel = await panel("Review 2 Panel", "TT Lab 3", REVIEW2_SLOT);

  const component = [{ componentId: new mongoose.Types.ObjectId(), name: "Eval", maxMarks: 50, subComponents: [{ name: "All", weight: 50 }] }];
  const review = (n, facultyType) => ({
    reviewName: `Review ${n}`, displayName: `Review ${n}`, facultyType, order: n, deadline: WINDOW, components: component,
  });
  await MarkingSchema.create({ ...CTX, reviews: [review(1, "guide"), review(2, "panel"), review(3, "panel")] });

  const [me, other] = await Student.create(["me", "other"].map((name, i) => ({
    regNo: `SCHED${i}`, name, emailId: `${name}@vitstudent.ac.in`, password, ...CTX,
  })));
  await Project.create({
    name: "Team", students: [me._id], guideFaculty: guide._id, panel: mainPanel._id,
    reviewPanels: [{ reviewType: "Review 2", panel: review2Panel._id }],
    type: "software", status: "active", teamSize: 1, ...CTX,
  });
  await Project.create({
    name: "Other Team", students: [other._id], guideFaculty: guide._id,
    type: "software", status: "active", teamSize: 1, ...CTX,
  });

  await startServer(5097, ["me@vitstudent.ac.in", "other@vitstudent.ac.in"]);
  const res = await call("me", "GET", "/student/project/SCHED0");
  assert.equal(res.status, 200, res.body.message);
  schedule = Object.fromEntries(res.body.data.reviewSchedule.map((r) => [r.reviewName, r]));
});

after(shutdown);

test("student sees every review, in order", async () => {
  const res = await call("me", "GET", "/student/project/SCHED0");
  assert.deepEqual(res.body.data.reviewSchedule.map((r) => r.reviewName), ["Review 1", "Review 2", "Review 3"]);
});

test("a review with its own panel shows that panel's date and venue", () => {
  assert.equal(schedule["Review 2"].venue, "TT Lab 3");
  assert.equal(new Date(schedule["Review 2"].dateTime).getTime(), REVIEW2_SLOT.getTime());
});

test("other panel reviews show the team's main panel date and venue", () => {
  assert.equal(schedule["Review 3"].venue, "SJT 501");
  assert.equal(new Date(schedule["Review 3"].dateTime).getTime(), MAIN_SLOT.getTime());
});

test("a guide review shows its window, no panel venue", () => {
  assert.equal(schedule["Review 1"].venue, null);
  assert.equal(new Date(schedule["Review 1"].window.from).getTime(), WINDOW.from.getTime());
  assert.equal(new Date(schedule["Review 1"].window.to).getTime(), WINDOW.to.getTime());
});

test("a team with no panel yet still sees its reviews, unscheduled", async () => {
  const res = await call("other", "GET", "/student/project/SCHED1");
  const r3 = res.body.data.reviewSchedule.find((r) => r.reviewName === "Review 3");
  assert.deepEqual([r3.venue, r3.dateTime], [null, null]);
});

test("a student cannot see another team's schedule", async () => {
  assert.equal((await call("other", "GET", "/student/project/SCHED0")).status, 403);
});
