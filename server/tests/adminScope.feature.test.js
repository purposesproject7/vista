// Feature test: the sudo admin configures any school / program / year, even
// though its own profile names one school; a school admin only their own.
// Drives the real API as each admin would. See harness.js for the database.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Faculty from "../models/facultySchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { openDb, hashedPassword, startServer, call, shutdown, SUDO_ID } from "./harness.js";

const YEAR = "2099-2100";
const SCOPE = { academicYear: YEAR, school: "SCOPE", program: "BTech CSE" };
const SENSE = { academicYear: YEAR, school: "SENSE", program: "BTech ECE" };

before(async () => {
  await openDb();
  const password = await hashedPassword();
  const admin = (key, employeeId) => ({
    name: key, emailId: `${key}@scopetest.local`, employeeId, phoneNumber: "9000000000",
    password, role: "admin", school: "SCOPE",
  });
  // Both profiles say SCOPE; only the sudo one may reach beyond it.
  await Faculty.create([admin("sudo", SUDO_ID), admin("scopeadmin", "SCOPE_ADMIN")]);
  await startServer(5098, ["sudo@scopetest.local", "scopeadmin@scopetest.local"]);
});

after(shutdown);

const get = (who, ctx) => call(who, "GET", `/admin/program-config?${new URLSearchParams(ctx)}`);

// What the Save button does (adminApi.saveProgramConfig): update if it exists, else create.
async function save(who, ctx, settings) {
  const existing = await get(who, ctx);
  return existing.body.data?._id
    ? call(who, "PUT", `/admin/program-config/${existing.body.data._id}`, { ...ctx, ...settings })
    : call(who, "POST", "/admin/program-config", { ...ctx, ...settings });
}

test("sudo admin creates and edits another school's settings", async () => {
  assert.ok((await save("sudo", SENSE, { maxTeamSize: 3 })).body.success);
  assert.ok((await save("sudo", SENSE, { requireTitleAbstractApproval: true })).body.success);

  const saved = (await get("sudo", SENSE)).body.data;
  assert.equal(saved.school, "SENSE"); // not moved onto the sudo admin's own SCOPE
  assert.equal(saved.maxTeamSize, 3);
  assert.equal(saved.requireTitleAbstractApproval, true);
});

test("sudo admin also configures its own school", async () => {
  assert.ok((await save("sudo", SCOPE, { similarityCheckEnabled: false })).body.success);
  assert.equal((await get("scopeadmin", SCOPE)).body.data.similarityCheckEnabled, false);
});

test("school admin cannot read or change another school's settings", async () => {
  // Asking for SENSE is answered with SCOPE's scope: nothing of SENSE leaks.
  assert.notEqual((await get("scopeadmin", SENSE)).body.data?.school, "SENSE");

  const senseId = String((await ProgramConfig.findOne({ school: "SENSE" }))._id);
  const put = await call("scopeadmin", "PUT", `/admin/program-config/${senseId}`, { ...SENSE, maxTeamSize: 9 });
  assert.equal(put.status, 403);
  const lock = await call("scopeadmin", "PATCH", `/admin/program-config/${senseId}/feature-lock`, {
    featureName: "panel_management", isLocked: true,
  });
  assert.equal(lock.status, 403);

  const sense = await ProgramConfig.findById(senseId).lean();
  assert.equal(sense.school, "SENSE");
  assert.equal(sense.maxTeamSize, 3);
  assert.equal(sense.featureLocks?.length ?? 0, 0);
});

test("nobody can move a config to another school, program or year", async () => {
  const id = String((await ProgramConfig.findOne({ school: "SCOPE" }))._id);
  await call("sudo", "PUT", `/admin/program-config/${id}`, { school: "SENSE", program: "Other", academicYear: "1999", maxTeamSize: 2 });
  const after = await ProgramConfig.findById(id).lean();
  assert.deepEqual([after.school, after.program, after.academicYear], ["SCOPE", "BTech CSE", YEAR]);
  assert.equal(after.maxTeamSize, 2); // the setting itself still saves
});

test("school admin still manages its own school", async () => {
  assert.ok((await save("scopeadmin", SCOPE, { maxTeamSize: 5 })).body.success);
  assert.equal((await get("scopeadmin", SCOPE)).body.data.maxTeamSize, 5);
});

// Master data, done the way the Settings screens do it (adminApi.js).
const masterData = async () => (await call("sudo", "GET", "/admin/master-data")).body.data;
const idOf = (list, code) => String(list.find((x) => x.code === code)._id);

test("sudo admin deletes a school: it is hidden, its record kept intact", async () => {
  for (const [name, code] of [["School of CSE", "SCOPE"], ["School of ECE", "SENSE"], ["Old School", "OLD"]]) {
    assert.ok((await call("sudo", "POST", "/admin/master-data/schools", { name, code })).body.success);
  }
  const del = await call("sudo", "PUT", `/admin/master-data/schools/${idOf((await masterData()).schools, "OLD")}`, { isActive: false });
  assert.equal(del.status, 200, del.body.message);

  const old = (await masterData()).schools.find((s) => s.code === "OLD");
  assert.deepEqual([old.name, old.isActive], ["Old School", false]);
});

test("school admin cannot add, rename or delete schools", async () => {
  const senseId = idOf((await masterData()).schools, "SENSE");
  assert.equal((await call("scopeadmin", "POST", "/admin/master-data/schools", { name: "X", code: "X" })).status, 403);
  assert.equal((await call("scopeadmin", "PUT", `/admin/master-data/schools/${senseId}`, { name: "Hacked", code: "SENSE" })).status, 403);
  assert.equal((await call("scopeadmin", "PUT", `/admin/master-data/schools/${senseId}`, { isActive: false })).status, 403);
  const sense = (await masterData()).schools.find((s) => s.code === "SENSE");
  assert.deepEqual([sense.name, sense.isActive], ["School of ECE", true]);
});

test("programs: each admin deletes only its own school's", async () => {
  await call("sudo", "POST", "/admin/master-data/programs", { name: "BTech ECE", code: "ECE", school: "SENSE" });
  await call("scopeadmin", "POST", "/admin/master-data/programs", { name: "BTech CSE", code: "CSE", school: "SCOPE" });
  const programs = (await masterData()).programs;

  assert.equal((await call("scopeadmin", "PUT", `/admin/master-data/programs/${idOf(programs, "ECE")}`, { isActive: false })).status, 403);
  const own = await call("scopeadmin", "PUT", `/admin/master-data/programs/${idOf(programs, "CSE")}`, { isActive: false });
  assert.equal(own.status, 200, own.body.message);

  const after = (await masterData()).programs;
  const cse = after.find((p) => p.code === "CSE");
  assert.deepEqual([cse.name, cse.isActive], ["BTech CSE", false]);
  assert.equal(after.find((p) => p.code === "ECE").isActive, true);
});
