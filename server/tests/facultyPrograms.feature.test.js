// Feature test: a faculty's programme list is every programme of their school,
// whatever the request says, and follows programme changes in settings.
// See harness.js for the database.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Faculty from "../models/facultySchema.js";
import { openDb, hashedPassword, startServer, call, shutdown, SUDO_ID } from "./harness.js";

before(async () => {
  await openDb();
  await Faculty.create({
    name: "sudo", emailId: "sudo@programs.local", employeeId: SUDO_ID, phoneNumber: "9000000000",
    password: await hashedPassword(), role: "admin", school: "SCOPE",
  });
  await startServer(5099, ["sudo@programs.local"]);
  for (const school of ["SCOPE", "SENSE"]) {
    await call("sudo", "POST", "/admin/master-data/schools", { name: school, code: school });
  }
  await call("sudo", "POST", "/admin/master-data/programs", { name: "B.Tech", code: "B.TECH", school: "SCOPE" });
  await call("sudo", "POST", "/admin/master-data/programs", { name: "IDP", code: "IDP", school: "SCOPE" });
  await call("sudo", "POST", "/admin/master-data/programs", { name: "BTech ECE", code: "ECE", school: "SENSE" });
});

after(shutdown);

const programsOf = async (employeeId) => (await Faculty.findOne({ employeeId }).lean()).program.sort();

test("new faculty get all of their school's programmes, not the requested one", async () => {
  const res = await call("sudo", "POST", "/admin/faculty", {
    name: "Suguna", emailId: "suguna@vit.ac.in", employeeId: "52215", phoneNumber: "9876543210",
    password: "secret123", role: "faculty", school: "SCOPE", program: ["IDP"], specialization: "AI",
  });
  assert.ok(res.body.success, res.body.message);
  assert.deepEqual(await programsOf("52215"), ["B.Tech", "IDP"]);
});

test("programme added, renamed and moved in settings follows to faculty", async () => {
  await call("sudo", "POST", "/admin/master-data/programs", { name: "MCA", code: "MCA", school: "SCOPE" });
  assert.deepEqual(await programsOf("52215"), ["B.Tech", "IDP", "MCA"]);

  const id = (await call("sudo", "GET", "/admin/master-data")).body.data.programs.find((p) => p.code === "MCA")._id;
  await call("sudo", "PUT", `/admin/master-data/programs/${id}`, { name: "MCA (2 yrs)", code: "MCA", school: "SCOPE" });
  assert.deepEqual(await programsOf("52215"), ["B.Tech", "IDP", "MCA (2 yrs)"]);

  await call("sudo", "PUT", `/admin/master-data/programs/${id}`, { name: "MCA (2 yrs)", code: "MCA", school: "SENSE" });
  assert.deepEqual(await programsOf("52215"), ["B.Tech", "IDP"]);
});

test("faculty moved to another school take that school's programmes", async () => {
  assert.ok((await call("sudo", "PUT", "/admin/faculty/52215", { school: "SENSE" })).body.success);
  assert.deepEqual(await programsOf("52215"), ["BTech ECE", "MCA (2 yrs)"]);
});
