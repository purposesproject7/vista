// Feature test: admin broadcasts reach students as well as faculty, both as
// notices and as access blocks. Drives the real API as each user would.
// See harness.js for the database.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import { openDb, hashedPassword, startServer, call, shutdown, SUDO_ID } from "./harness.js";

const SCOPE = { school: "SCOPE", program: "BTech CSE", academicYear: "2099-2100" };
const SENSE = { school: "SENSE", program: "BTech ECE", academicYear: "2099-2100" };
const tomorrow = () => new Date(Date.now() + 864e5).toISOString();

before(async () => {
  await openDb();
  const password = await hashedPassword();
  const staff = (key, employeeId, role) => ({
    name: key, emailId: `${key}@bctest.local`, employeeId, phoneNumber: "9000000000", password, role, ...SCOPE,
  });
  await Faculty.create([staff("sudo", SUDO_ID, "admin"), staff("teacher", "BC_TEACHER", "faculty")]);
  await Student.create([
    { regNo: "BC1", name: "Scope Student", emailId: "scopekid@vitstudent.ac.in", password, ...SCOPE },
    { regNo: "BC2", name: "Sense Student", emailId: "sensekid@vitstudent.ac.in", password, ...SENSE },
  ]);
  await startServer(5096, [
    "sudo@bctest.local", "teacher@bctest.local", "scopekid@vitstudent.ac.in", "sensekid@vitstudent.ac.in",
  ]);
});

after(shutdown);

// What the admin's Send button does (adminApi.createBroadcast).
async function broadcast(fields) {
  const res = await call("sudo", "POST", "/admin/broadcasts", {
    title: fields.message, expiresAt: tomorrow(), targetSchools: [], targetPrograms: [], action: "notice", ...fields,
  });
  assert.equal(res.status, 201, res.body.message);
  return res.body.data._id;
}
const end = (id) => call("sudo", "PUT", `/admin/broadcasts/${id}`, { isActive: false });

const seen = async (who) => {
  const path = who === "teacher" ? "/faculty/broadcasts" : "/student/broadcasts";
  return (await call(who, "GET", path)).body.data.map((b) => b.message);
};
// A normal page load for each: is the user let in?
const canUse = async (who) => {
  const path = { teacher: "/faculty/projects", scopekid: "/student/project/BC1", sensekid: "/student/project/BC2" }[who];
  const res = await call(who, "GET", path);
  return !(res.status === 403 && res.body.blocked);
};

test("a student notice reaches the targeted students only, not faculty", async () => {
  const id = await broadcast({ message: "Submit your abstracts", audience: "students", targetSchools: ["SCOPE"] });
  assert.ok((await seen("scopekid")).includes("Submit your abstracts"));
  assert.ok(!(await seen("sensekid")).includes("Submit your abstracts"));
  assert.ok(!(await seen("teacher")).includes("Submit your abstracts"));
  await end(id);
});

test("a faculty notice stays with faculty (the default, as before)", async () => {
  const id = await broadcast({ message: "Faculty meeting at 4" });
  assert.ok((await seen("teacher")).includes("Faculty meeting at 4"));
  assert.ok(!(await seen("scopekid")).includes("Faculty meeting at 4"));
  await end(id);
});

test("an 'everyone' notice reaches both", async () => {
  const id = await broadcast({ message: "Portal maintenance Sunday", audience: "all" });
  for (const who of ["teacher", "scopekid", "sensekid"]) {
    assert.ok((await seen(who)).includes("Portal maintenance Sunday"), who);
  }
  await end(id);
});

test("a student cannot ask for another school's notices", async () => {
  const id = await broadcast({ message: "SCOPE only", audience: "students", targetSchools: ["SCOPE"] });
  const res = await call("sensekid", "GET", "/student/broadcasts?school=SCOPE&program=BTech%20CSE");
  assert.ok(!res.body.data.map((b) => b.message).includes("SCOPE only"));
  await end(id);
});

test("blocking students locks out the targeted students only; they can still read why", async () => {
  const id = await broadcast({ message: "Portal closed for review week", audience: "students", action: "block", targetSchools: ["SCOPE"] });
  assert.equal(await canUse("scopekid"), false);
  assert.ok((await seen("scopekid")).includes("Portal closed for review week"));
  assert.equal(await canUse("sensekid"), true);
  assert.equal(await canUse("teacher"), true);

  await end(id);
  assert.equal(await canUse("scopekid"), true, "student still blocked after the broadcast was ended");
});

test("blocking faculty leaves students alone (as before)", async () => {
  const id = await broadcast({ message: "Marks entry closed", action: "block" });
  assert.equal(await canUse("teacher"), false);
  assert.equal(await canUse("scopekid"), true);
  await end(id);
  assert.equal(await canUse("teacher"), true);
});
