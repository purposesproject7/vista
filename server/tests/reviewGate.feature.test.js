// Feature test: "Hold teams out of reviews until the guide accepts the title &
// abstract" (admin Content Check setting). Drives the real API as the admin,
// the guide and a panel member would, against a throwaway database.
//
//   TEST_MONGO_URI="mongodb+srv://.../vista_feature_test?..." npm test
//
// The database name must end in "_feature_test"; it is dropped before and after.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";

const URI = process.env.TEST_MONGO_URI;
const PORT = 5099;
const API = `http://127.0.0.1:${PORT}/api`;
const CTX = { school: "GateTest School", program: "GateTest Program", academicYear: "2099-2100" };
const PASSWORD = "gate-test-pass";

let server;
const ids = {};
const tokens = {};

async function call(who, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[who]}` },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const reviewTeamIds = async (who) =>
  (await call(who, "GET", "/faculty/reviews")).body.data.map((p) => String(p._id));

const marks = (who, team, reviewType) =>
  call(who, "POST", "/faculty/marks", {
    student: ids[`${team}Student`],
    project: ids[team],
    reviewType,
    componentMarks: [{ componentId: ids.component, componentName: "Eval", componentTotal: 40, componentMaxTotal: 50 }],
    totalMarks: 40,
    maxTotalMarks: 50,
  });

// What the admin's Save button does (adminApi.saveProgramConfig): update the
// program's config if it exists, otherwise create it.
async function adminSetsHoldOut(on) {
  const q = new URLSearchParams(CTX);
  const existing = await call("admin", "GET", `/admin/program-config?${q}`);
  const res = existing.body.data?._id
    ? await call("admin", "PUT", `/admin/program-config/${existing.body.data._id}`, { ...CTX, requireTitleAbstractApproval: on })
    : await call("admin", "POST", "/admin/program-config", { ...CTX, requireTitleAbstractApproval: on });
  assert.ok(res.body.success, `admin save failed: ${res.body.message}`);
}

before(async () => {
  assert.ok(URI, "Set TEST_MONGO_URI to a throwaway database");
  const dbName = new URL(URI.replace(/^mongodb(\+srv)?:/, "http:")).pathname.slice(1);
  // Strict on purpose: a plain "test" database is what Atlas URIs without a
  // name default to, i.e. likely real data.
  assert.match(dbName, /_feature_test$/, `TEST_MONGO_URI database "${dbName}" must end in "_feature_test" (it gets dropped)`);

  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();

  const password = await bcrypt.hash(PASSWORD, 10);
  const person = (key, role) => ({
    name: key, emailId: `${key}@gatetest.local`, employeeId: `GATE_${key.toUpperCase()}`,
    phoneNumber: "9000000000", password, role, ...CTX,
  });
  const [admin, guide, panelist] = await Faculty.create([
    person("admin", "admin"), person("guide", "faculty"), person("panelist", "faculty"),
  ]);
  ids.component = new mongoose.Types.ObjectId();

  const week = { from: new Date(Date.now() - 864e5), to: new Date(Date.now() + 7 * 864e5) };
  const component = [{ componentId: ids.component, name: "Eval", maxMarks: 50, subComponents: [{ name: "All", weight: 50 }] }];
  await MarkingSchema.create({
    ...CTX,
    reviews: [
      { reviewName: "Review 1", displayName: "Guide review", facultyType: "guide", order: 1, deadline: week, components: component },
      { reviewName: "Review 2", displayName: "Panel review", facultyType: "panel", order: 2, deadline: week, components: component },
    ],
  });

  const panel = await Panel.create({
    panelName: "Gate Panel", facultyEmployeeIds: [panelist.employeeId],
    members: [{ faculty: panelist._id, facultyEmployeeId: panelist.employeeId }], isActive: true, ...CTX,
  });

  // "submitted": title & abstract waiting on the guide. "legacy": never submitted.
  for (const [team, status] of [["submitted", "pending_review"], ["legacy", "not_started"]]) {
    const student = await Student.create({
      regNo: `GATE_${team}`, name: team, emailId: `${team}@gatetest.local`, password, ...CTX,
    });
    const project = await Project.create({
      name: `Team ${team}`, students: [student._id], guideFaculty: guide._id, panel: panel._id,
      type: "software", status: "active", teamSize: 1, ...CTX,
      titleAbstractStatus: status, proposedTitle: `Accepted ${team}`, proposedAbstract: "An abstract.",
      // Guide has approved the PPT, so the panel is otherwise free to mark.
      pptApprovals: [{ reviewType: "Review 2", isApproved: true, approvedBy: guide._id }],
    });
    ids[team] = String(project._id);
    ids[`${team}Student`] = String(student._id);
  }

  server = spawn(process.execPath, ["index.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    // A model that cannot load: accepting a title then skips the (non-fatal)
    // embedding step instead of downloading a model.
    env: { ...process.env, MONGO_URI: URI, PORT: String(PORT), HOST: "127.0.0.1", NODE_ENV: "test", EMBEDDING_MODEL: "none/none" },
    stdio: "ignore",
  });
  for (let i = 0; ; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/health`)).ok) break; } catch {}
    assert.ok(i < 60, "server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }

  for (const who of ["admin", "guide", "panelist"]) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: `${who}@gatetest.local`, password: PASSWORD }),
    });
    tokens[who] = (await res.json()).token;
    assert.ok(tokens[who], `${who} could not log in`);
  }
});

after(async () => {
  server?.kill();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

// Tests run in order: each step is the next thing that happens in the semester.

test("setting off (default): unapproved teams are reviewed exactly as before", async () => {
  assert.ok((await reviewTeamIds("guide")).includes(ids.legacy));
  assert.ok((await reviewTeamIds("panelist")).includes(ids.legacy));
  assert.equal((await marks("guide", "legacy", "Review 1")).status, 201);
});

test("admin turns it on: unapproved teams vanish from guide and panel reviews", async () => {
  await adminSetsHoldOut(true);
  for (const who of ["guide", "panelist"]) {
    const visible = await reviewTeamIds(who);
    assert.ok(!visible.includes(ids.submitted), `${who} still sees the submitted team`);
    assert.ok(!visible.includes(ids.legacy), `${who} still sees the legacy team`);
  }
});

test("on: the dashboard review list hides them too", async () => {
  const { guideProjects, panelProjects } = (await call("guide", "GET", "/faculty/projects")).body.data;
  const team = guideProjects.find((p) => String(p._id) === ids.submitted);
  // Still delivered (the Title & Abstract Reviews section lists it) but held out of reviews.
  assert.equal(team.titleAbstractStatus, "pending_review");
  assert.equal(team.reviewsLocked, true);
  const panelView = (await call("panelist", "GET", "/faculty/projects")).body.data.panelProjects;
  assert.equal(panelView.find((p) => String(p._id) === ids.submitted).reviewsLocked, true);
});

test("on: the guide cannot approve an unapproved team's PPT", async () => {
  const res = await call("guide", "POST", "/faculty/approvals/ppt", {
    studentId: ids.legacyStudent, reviewType: "Review 2", sdgGoal: "All",
  });
  assert.notEqual(res.status, 200);
  assert.match(res.body.message, /accepted by the guide/);
});

test("on: neither guide nor panel can enter marks for an unapproved team", async () => {
  const guide = await marks("guide", "submitted", "Review 1");
  const panel = await marks("panelist", "submitted", "Review 2");
  assert.notEqual(guide.status, 201);
  assert.notEqual(panel.status, 201);
  assert.match(guide.body.message, /accepted by the guide/);
});

test("on: marks entered before the switch are kept", async () => {
  const { body } = await call("guide", "GET", "/faculty/marks");
  const all = body.data.student_marks || body.data;
  assert.ok(all.some((m) => String(m.project?._id || m.project) === ids.legacy && m.reviewType === "Review 1"));
});

test("guide accepts the title & abstract: the team joins reviews and can be marked", async () => {
  const accept = await call("guide", "PUT", `/project/${ids.submitted}/accept-title-abstract`);
  assert.equal(accept.status, 200, accept.body.message);

  assert.ok((await reviewTeamIds("guide")).includes(ids.submitted));
  assert.ok((await reviewTeamIds("panelist")).includes(ids.submitted));
  assert.equal((await marks("guide", "submitted", "Review 1")).status, 201);
  assert.equal((await marks("panelist", "submitted", "Review 2")).status, 201);

  // The other, still unapproved team stays held out.
  assert.ok(!(await reviewTeamIds("guide")).includes(ids.legacy));
});

test("admin turns it off: held-out teams come straight back", async () => {
  await adminSetsHoldOut(false);
  assert.ok((await reviewTeamIds("panelist")).includes(ids.legacy));
  assert.equal((await marks("panelist", "legacy", "Review 2")).status, 201);
});
