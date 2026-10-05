import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import MasterData from '../models/masterDataSchema.js';
import Faculty from '../models/facultySchema.js';
import Student from '../models/studentSchema.js';
import Project from '../models/projectSchema.js';
import Panel from '../models/panelSchema.js';
import MarkingSchema from '../models/markingSchema.js';
import ComponentLibrary from '../models/componentLibrarySchema.js';
import Request from '../models/requestSchema.js';
import { RequestService } from '../services/requestService.js';
import { MarkingSchemaService } from '../services/markingSchemaService.js';
import { StudentService } from '../services/studentService.js';
import { ProjectService } from '../services/projectService.js';
import { expandContextQuery } from '../utils/academicContext.js';
import { findRequestedAssignment } from '../middlewares/rbac.js';
import { normalizeReviewName, reviewNamesMatch, resolveReview } from '../utils/reviewIdentity.js';
import * as clientReviews from '../../client/src/shared/utils/reviewHelpers.js';
import { programsForSchool, normalizeMasterData } from '../../client/src/shared/utils/academicContext.js';
import { openDb, hashedPassword, startServer, call, shutdown } from './harness.js';
const ctx = { school: 'School of Computing', program: 'B.Tech', academicYear: 'Fall Semester 2099-2100' };
const otherYear = 'Fall Semester 2098-2099';
const query = new URLSearchParams({ school: 'SCOPE', program: 'B.TECH', academicYear: ctx.academicYear });
let master, guide, main, replacement, student, team, schema, library, component, password;
const payload = (reviewType = 'Review III', extra = {}) => ({ student: String(student._id), project: String(team._id), reviewType, facultyType: 'panel', componentMarks: [{ componentId: String(component), componentName: 'Evaluation', componentTotal: 15, componentMaxTotal: 20 }], totalMarks: 15, maxTotalMarks: 20, ...extra });
before(async () => {
  await openDb();
  master = await MasterData.create({ schools: [{ code: 'SCOPE', name: ctx.school }, { code: 'OTHER', name: 'Other School' }], programs: [{ code: 'B.TECH', name: ctx.program, school: 'SCOPE' }, { code: 'IDP', name: 'IDP', school: 'SCOPE' }, { code: 'B.TECH CSE', name: 'B.Tech CSE', school: 'SCOPE' }, { code: 'B.TECH', name: ctx.program, school: 'OTHER' }], academicYears: [{ year: ctx.academicYear, isCurrent: true }, { year: otherYear }] });
  password = await hashedPassword();
  const person = name => ({ name, emailId: `${name}@audittest.local`, employeeId: `AUDIT_${name}`, phoneNumber: '9000000000', password, school: ' scope ', program: ['IDP'] });
  [guide, main, replacement] = await Faculty.create([person('guide'), person('main'), person('replacement')]);
  student = await Student.create({ name: 'Student', regNo: 'AUDIT_STUDENT', emailId: 'student@vitstudent.ac.in', password, ...ctx });
  const mainPanel = await Panel.create({ ...ctx, panelName: 'Main', members: [{ faculty: main._id }], facultyEmployeeIds: [main.employeeId] });
  const override = await Panel.create({ ...ctx, panelName: 'Override', facultyEmployeeIds: [replacement.employeeId] });
  team = await Project.create({ ...ctx, name: 'Audit Team', guideFaculty: guide._id, students: [student._id], panel: mainPanel._id, reviewPanels: [{ reviewType: 'Review III', panel: override._id }], type: 'software', teamSize: 1 });
  library = await ComponentLibrary.create({ ...ctx, components: [{ name: 'Evaluation', maxMarks: 20 }] });
  component = library.components[0]._id;
  const deadline = { from: new Date(Date.now() - 864e5), to: new Date(Date.now() + 864e5) };
  const review = (name, facultyType, isActive = true) => ({ reviewName: name, displayName: name === 'review_3_8420' ? 'Review 3' : name, facultyType, isActive, order: 1, deadline, components: [{ componentId: component, name: 'Evaluation', maxMarks: 20 }] });
  schema = await MarkingSchema.create({ ...ctx, reviews: [review('review_3_8420', 'panel'), review('Review 1', 'guide'), review('Review 4', 'panel', false)] });
  await startServer(5095, [guide.emailId, main.emailId, replacement.emailId, student.emailId]);
});
after(shutdown);
test('faculty rubric lookup accepts exact codes, names, case and whitespace', async () => {
  for (const [school, program] of [['SCOPE', 'B.TECH'], [ctx.school, ctx.program], [' scope ', ' b.tech ']]) {
    const res = await call('guide', 'GET', '/faculty/marking-schema?' + new URLSearchParams({ school, program, academicYear: ctx.academicYear }));
    assert.equal(res.status, 200, res.body.message); assert.equal(res.body.data.reviews[0].reviewName, 'review_3_8420');
  }
});
test('faculty can read its component library without an admin endpoint', async () => {
  const res = await call('guide', 'GET', `/faculty/component-library?${query}`);
  assert.equal(res.status, 200, res.body.message); assert.equal(String(res.body.data._id), String(library._id));
});
test('missing context and configuration fail explicitly', async () => {
  assert.equal((await call('guide', 'GET', '/faculty/marking-schema')).status, 400);
  assert.equal((await call('guide', 'GET', '/faculty/marking-schema?' + new URLSearchParams({ ...ctx, program: 'All Programs' }))).status, 400);
  const res = await call('guide', 'GET', '/faculty/marking-schema?' + new URLSearchParams({ ...ctx, program: 'IDP' }));
  assert.equal(res.status, 404); assert.equal(res.body.success, false);
});
test('record writes canonicalize school/programme strings and arrays', async () => {
  assert.equal((await Faculty.findById(guide._id)).school, ctx.school);
  const s = await Student.create({ ...ctx, school: 'scope', program: ' b.tech ', regNo: 'ALIASED', name: 'Aliased', emailId: 'aliased@vitstudent.ac.in', password });
  assert.equal(s.program, 'B.Tech'); assert.equal(s.school, ctx.school);
  assert.equal((await Faculty.find({ school: 'SCOPE', program: { $in: ['idp'] } })).length, 3);
});
test('unknown and cross-school context writes are rejected', async () => {
  await assert.rejects(Student.create({ ...ctx, program: 'Unknown', regNo: 'BAD', name: 'Bad', emailId: 'bad@vitstudent.ac.in', password }), /Programme/);
  await assert.rejects(Student.updateOne({ _id: student._id }, { $set: { school: 'OTHER', program: 'IDP' } }), /does not belong/);
});
test('insertMany and bulkWrite use canonical context rules; unsafe operators are blocked', async () => {
  const [s] = await Student.insertMany([{ ...ctx, school: ' scope ', program: 'b.tech', name: 'Inserted', regNo: 'INSERTED', emailId: 'inserted@vitstudent.ac.in', password }]);
  assert.equal(s.school, ctx.school);
  await Student.bulkWrite([{ updateOne: { filter: { _id: s._id }, update: { $set: { school: 'SCOPE', program: 'B.TECH' } } } }]);
  assert.equal((await Student.findById(s._id)).program, 'B.Tech');
  await assert.rejects(Student.updateOne({ _id: s._id }, { $unset: { program: 1 } }), /explicit/);
  await assert.rejects(Faculty.updateOne({ _id: guide._id }, { $push: { program: 'Unknown' } }), /explicit/);
});
test('context filters cannot match prefix programmes or other schools', async () => {
  await Student.create({ ...ctx, program: 'B.Tech CSE', name: 'CSE', regNo: 'PREFIX', emailId: 'prefix@vitstudent.ac.in', password });
  await Student.create({ ...ctx, school: 'OTHER', name: 'Other', regNo: 'OTHER', emailId: 'other@vitstudent.ac.in', password });
  assert.ok(!(await Student.find({ school: 'SCOPE', program: 'B.TECH' })).some(s => ['OTHER', 'PREFIX'].includes(s.regNo)));
  assert.deepEqual(expandContextQuery({ program: { $in: [] } }, master.toObject()).program, { $in: [] });
});
test('equivalent configurations cannot be duplicated', async () => {
  await assert.rejects(MarkingSchema.create({ ...ctx, school: 'scope', program: 'B.TECH', reviews: [] }), /equivalent/);
});
test('legacy conflicting schemas produce a conflict instead of arbitrary data', async () => {
  const duplicate = await MarkingSchema.collection.insertOne({ school: 'scope', program: 'B.TECH', academicYear: ctx.academicYear, reviews: [] });
  try { const res = await call('guide', 'GET', `/faculty/marking-schema?${query}`); assert.equal(res.status, 409); assert.match(res.body.message, /Conflicting/); }
  finally { await MarkingSchema.collection.deleteOne({ _id: duplicate.insertedId }); }
});
test('guide and panel list queries preserve the selected year', async () => {
  await Project.create({ ...ctx, academicYear: otherYear, name: 'Prior Team', students: [], guideFaculty: guide._id, type: 'software', teamSize: 0 });
  const filters = { school: 'SCOPE', program: 'B.TECH', academicYear: ctx.academicYear };
  assert.ok(!JSON.stringify(await ProjectService.getGuideProjects(filters)).includes('Prior Team'));
  assert.ok(!JSON.stringify(await ProjectService.getPanelProjects(filters)).includes('Prior Team')); assert.equal(filters.academicYear, ctx.academicYear);
});
test('requests follow student programme despite IDP faculty profiles', async () => {
  await Request.create({ ...ctx, faculty: guide._id, facultyType: 'guide', student: student._id, project: team._id, reviewType: 'Review 1', requestType: 'mark_edit', reason: 'Audit' });
  const list = await RequestService.getAllRequests({ school: 'SCOPE', program: 'B.TECH', academicYear: ctx.academicYear });
  assert.equal(list.length, 1); assert.deepEqual(list[0].faculty.program, ['IDP']);
});
test('review identities distinguish numbers and generated IDs; client/server contracts agree', () => {
  assert.notEqual(normalizeReviewName('Review 1'), normalizeReviewName('Review 2'));
  assert.equal(reviewNamesMatch('Review III', 'review_3_8420'), true); assert.equal(reviewNamesMatch('review_3_1111', 'review_3_2222'), false);
  for (const name of ['Review 1', 'Review II', 'review_3_8420', 'review1', 'custom_review_1']) assert.equal(clientReviews.normalizeReviewName(name), normalizeReviewName(name));
  assert.equal(clientReviews.findPPTApproval([{ reviewType: 'Review 1', isApproved: true }], 'Review 2'), undefined);
  assert.throws(() => resolveReview([{ reviewName: 'review_3_1111' }, { reviewName: 'review_3_2222' }], 'Review 3'), /Ambiguous/);
});
test('main panel membership does not override the review-specific panel', async () => {
  const res = await call('main', 'POST', '/faculty/marks', payload()); assert.equal(res.status, 400); assert.match(res.body.message, /not assigned/);
});
test('guide mode cannot grade a panel-only review', async () => {
  const res = await call('guide', 'POST', '/faculty/marks', payload('Review III', { facultyType: 'guide' })); assert.equal(res.status, 400); assert.match(res.body.message, /not assigned/);
});
test('unconfigured or inactive reviews and foreign students are rejected', async () => {
  for (const review of ['Review 99', 'Review 4']) assert.equal((await call('replacement', 'POST', '/faculty/marks', payload(review))).status, 400);
  const foreign = await Student.findOne({ regNo: 'OTHER' });
  const res = await call('replacement', 'POST', '/faculty/marks', payload('Review III', { student: String(foreign._id) })); assert.equal(res.status, 400); assert.match(res.body.message, /does not belong/);
});
test('mark scores and totals must match configured components', async () => {
  for (const extra of [{ totalMarks: 999 }, { maxTotalMarks: 999 }, { componentMarks: [{ componentId: String(component), componentName: 'Evaluation', componentTotal: -1, componentMaxTotal: 20 }] }]) assert.equal((await call('replacement', 'POST', '/faculty/marks', payload('Review III', extra))).status, 400);
});
test('employee-ID membership accepts a legacy label and stores the stable review ID', async () => {
  const res = await call('replacement', 'POST', '/faculty/marks', payload()); assert.equal(res.status, 201, res.body.message);
  assert.equal(res.body.data.reviewType, 'review_3_8420'); assert.equal(res.body.data.program, ctx.program); assert.equal(res.body.data.facultyType, 'panel');
});
test('used review IDs cannot be removed; display labels can be edited', async () => {
  await assert.rejects(MarkingSchemaService.updateMarkingSchema(schema._id, { reviews: [] }), /cannot be renamed or removed/);
  const reviews = schema.toObject().reviews; reviews[0].displayName = 'Implementation review';
  assert.equal((await MarkingSchemaService.updateMarkingSchema(schema._id, { reviews })).reviews[0].reviewName, 'review_3_8420');
});
test('duplicate review IDs and invalid review dates fail validation', () => {
  const review = schema.toObject().reviews[0];
  assert.ok(MarkingSchemaService.validateMarkingSchema({ ...ctx, reviews: [review, review] }).some(e => e.includes('duplicate')));
  assert.ok(MarkingSchemaService.validateMarkingSchema({ ...ctx, reviews: [{ ...review, deadline: { from: 'invalid', to: 'invalid' } }] }).some(e => e.includes('deadline')));
});
test('repeated registration numbers require years and self APIs use authenticated identity', async () => {
  await Student.create({ ...ctx, academicYear: otherYear, regNo: student.regNo, name: 'Prior Student', emailId: 'prior@vitstudent.ac.in', password });
  await assert.rejects(StudentService.getStudentByRegNo(student.regNo), /multiple academic years/);
  assert.equal((await StudentService.getStudentByRegNo(student.regNo, otherYear)).name, 'Prior Student');
  const res = await call('student', 'GET', '/student/project/' + student.regNo); assert.equal(res.status, 200, res.body.message); assert.equal(res.body.data.name, team.name);
});
test('coordinator selection never falls back to an unrelated or wrong-year assignment', () => {
  const assignments = [{ ...ctx }, { ...ctx, academicYear: otherYear }];
  assert.equal(findRequestedAssignment(assignments, { query: { school: 'SCOPE', program: 'B.TECH', academicYear: ctx.academicYear } }, master.toObject()), assignments[0]);
  assert.equal(findRequestedAssignment(assignments, { query: { program: 'B.TECH', academicYear: 'Unknown' } }, master.toObject()), null);
  assert.equal(findRequestedAssignment(assignments, { query: { program: 'B.TECH' } }, master.toObject()), null);
});
test('metadata rejects duplicate aliases and changing identifiers in use', async () => {
  await assert.rejects(new MasterData({ schools: [{ name: 'School', code: 'S' }, { name: ' s ', code: 'OTHER' }] }).validate(), /Duplicate school/);
  const edited = await MasterData.findById(master._id); edited.programs[0].code = 'RENAMED'; await assert.rejects(edited.save(), /identifiers are in use/);
});
test('frontend school metadata supports both code and name representations', () => {
  const data = master.toObject(); assert.equal(programsForSchool(data.programs, ctx.school, data.schools).length, 3);
  assert.equal(normalizeMasterData({ ...data, programs: [{ school: ctx.school, name: 'B.Tech' }] }).programs[0].school, 'SCOPE');
});
test('draft marks do not count and both-role totals sum guide and panel average', () => {
  const sample = { guideMarks: [{ reviewType: 'Review 1', facultyType: 'guide', totalMarks: 10, isSubmitted: true }, { reviewType: 'Review 2', facultyType: 'guide', totalMarks: 99, isSubmitted: false }], panelMarks: [{ reviewType: 'Review 1', facultyType: 'panel', totalMarks: 12, isSubmitted: true }, { reviewType: 'Review 1', facultyType: 'panel', totalMarks: 18, isSubmitted: true }] };
  const result = StudentService.processStudentData(sample, null, [{ reviewName: 'Review 1', facultyType: 'both' }, { reviewName: 'Review 2', facultyType: 'guide' }]);
  assert.equal(result.reviews['Review 1'].total, 25); assert.equal(result.reviews['Review 2'].total, 0);
});

test('unknown generated review IDs never fall through to a display label', () => {
  assert.equal(resolveReview([{ reviewName: 'review_3_1111', displayName: 'Review 3' }], 'review_3_2222'), undefined);
});
test('canonical validation remains active when document validation is skipped', async () => {
  const faculty = await Faculty.findById(guide._id); faculty.program = ['Unknown'];
  await assert.rejects(faculty.save({ validateBeforeSave: false }), /Programme/);
});
test('upserts store explicit canonical context rather than regex filters', async () => {
  await Student.updateOne({ regNo: 'UPSERT', school: 'SCOPE', program: 'B.TECH', academicYear: ctx.academicYear }, { $set: { name: 'Upserted', emailId: 'upsert@vitstudent.ac.in', password } }, { upsert: true });
  const inserted = await Student.findOne({ regNo: 'UPSERT', academicYear: ctx.academicYear });
  assert.equal(inserted.school, ctx.school); assert.equal(inserted.program, ctx.program);
});
test('faculty lists do not query a nonexistent faculty academicYear field', async () => {
  const { FacultyService } = await import('../services/facultyService.js');
  assert.equal((await FacultyService.getFacultyList({ school: 'SCOPE', program: 'IDP', academicYear: ctx.academicYear })).length, 3);
});
test('panel assignment rejects another academic year even with specialization override', async () => {
  const { PanelService } = await import('../services/panelService.js');
  const panel = await Panel.create({ ...ctx, academicYear: otherYear, panelName: 'Prior Panel' });
  await assert.rejects(PanelService.assignPanelToProject(panel._id, team._id, guide._id, true), /same academic context/);
});
test('faculty broadcast audiences include evaluated programmes and aliases', async () => {
  const { audienceOf, activeBroadcastsFilter } = await import('../utils/broadcastAudience.js');
  const BroadcastMessage = (await import('../models/broadcastMessageSchema.js')).default;
  const target = await BroadcastMessage.create({ message: 'Context audit', targetSchools: ['SCOPE'], targetPrograms: ['B.TECH'], expiresAt: new Date(Date.now() + 864e5), createdBy: guide._id, createdByEmployeeId: guide.employeeId, createdByName: guide.name });
  const audience = await audienceOf(guide._id, 'faculty');
  assert.ok(audience.programs.includes('B.Tech'));
  assert.ok((await BroadcastMessage.find(await activeBroadcastsFilter(audience))).some(b => String(b._id) === String(target._id)));
});
test('read-only audit reports legacy mismatches without changing records', async () => {
  const { auditAcademicContext } = await import('../scripts/auditAcademicContext.js');
  const Marks = (await import('../models/marksSchema.js')).default;
  const legacy = await Marks.collection.insertOne({ ...ctx, program: 'IDP', student: student._id, project: team._id, faculty: main._id, facultyType: 'panel', reviewType: 'Review 1', totalMarks: 5, maxTotalMarks: 20 });
  const before = await Marks.collection.countDocuments();
  assert.ok((await auditAcademicContext()).issues['Marks.studentContextMismatch'] >= 1);
  assert.equal(await Marks.collection.countDocuments(), before);
  assert.equal((await Marks.collection.findOne({ _id: legacy.insertedId })).program, 'IDP');
});

test('the Guide empty state explains an open panel review while preserving role restrictions', async () => {
  const { reviewAvailabilityMessage, gradingReviewsForRole } = await import('../../client/src/shared/utils/facultyReviewState.js');
  const reviews = [{ displayName: 'Review 3', facultyType: 'panel', deadline: { from: '2026-09-15', to: '2026-10-10' } }];
  const filters = { school: 'SCOPE', program: 'B.Tech', year: 'Fall Semester 2026-27', role: 'guide' };
  assert.match(reviewAvailabilityMessage(reviews, filters, new Date('2026-10-05')), /Review 3 is open for panel evaluation/);
  assert.equal(gradingReviewsForRole(reviews, 'guide').length, 0);
  assert.equal(gradingReviewsForRole(reviews, 'panel').length, 1);
  assert.match(reviewAvailabilityMessage(reviews, { ...filters, program: '' }), /Select a school/);
});
test('reports group legacy review labels and include submitted zero scores in panel averages', async () => {
  const Marks = (await import('../models/marksSchema.js')).default;
  const { ReportService } = await import('../services/reportService.js');
  await Marks.collection.insertOne({ ...ctx, student: student._id, project: team._id, faculty: main._id, facultyType: 'panel', reviewType: 'Review III', totalMarks: 0, maxTotalMarks: 20, isSubmitted: true });
  const report = await ReportService.generateReport('comprehensive-marks', { school: 'SCOPE', programme: 'B.TECH', year: ctx.academicYear });
  const rows = report.filter(row => row.regNo === student.regNo && row.reviewType === 'review_3_8420');
  assert.equal(rows.length, 1); assert.equal(Number(rows[0].panelMarks), 7.5);
});
test('direct rubric saves also protect used review identities', async () => {
  const current = await MarkingSchema.findById(schema._id); current.reviews = [];
  await assert.rejects(current.save(), /cannot be renamed or removed/);
});
test('student list views use each programme rubric independently', async () => {
  await MarkingSchema.create({ ...ctx, program: 'B.Tech CSE', reviews: [{ reviewName: 'Review 7', displayName: 'CSE review', facultyType: 'guide', order: 1, deadline: { from: new Date(Date.now() - 864e5), to: new Date(Date.now() + 864e5) }, components: [{ componentId: component, name: 'Evaluation', maxMarks: 20 }] }] });
  const list = await StudentService.getFilteredStudents({ school: 'SCOPE', academicYear: ctx.academicYear });
  assert.ok(Object.keys(list.find(row => row.regNo === 'PREFIX').reviews).includes('Review 7'));
  assert.ok(!Object.keys(list.find(row => row.regNo === student.regNo).reviews).includes('Review 7'));
});
test('dual-role faculty evaluation respects the explicitly selected role', async () => {
  const { getFacultyTypeForProject } = await import('../utils/facultyHelpers.js');
  const panel = await Panel.findById(team.panel); panel.members.push({ faculty: guide._id }); await panel.save();
  const current = await MarkingSchema.findById(schema._id); current.reviews.push({ ...current.reviews[1].toObject(), reviewName: 'Review 5', displayName: 'Both roles', facultyType: 'both' }); await current.save();
  assert.equal((await getFacultyTypeForProject(guide._id, team._id, 'Review 5', 'panel')).facultyType, 'panel');
  assert.equal((await getFacultyTypeForProject(guide._id, team._id, 'Review 5', 'guide')).facultyType, 'guide');
});

test('ordinary student edits cannot leave one member in another programme', async () => {
  const current = await Student.findById(student._id); current.program = 'B.Tech CSE';
  await assert.rejects(current.save(), /must match the active project/);
});
test('project writes reject foreign-context members and panels', async () => {
  const foreign = await Student.findOne({ regNo: 'OTHER' });
  await assert.rejects(Project.create({ ...ctx, name: 'Invalid Team', students: [foreign._id], guideFaculty: guide._id, type: 'software', teamSize: 1 }), /Every project member/);
  const priorPanel = await Panel.findOne({ panelName: 'Prior Panel' });
  const current = await Project.findById(team._id); current.panel = priorPanel._id;
  await assert.rejects(current.save({ validateBeforeSave: false }), /Project panels/);
});

test('panel reports include employee-only members and count the actual review-specific assignment', async () => {
  const { ReportService } = await import('../services/reportService.js');
  const filters = { school: 'SCOPE', programme: 'B.TECH', year: ctx.academicYear };
  const workload = await ReportService.generateReport('faculty-workload', filters);
  assert.equal(workload.find(row => row.name === replacement.name).panelsAssigned, 1);
  assert.equal(workload.find(row => row.name === replacement.name).email, replacement.emailId);
  const statuses = await ReportService.generateReport('panel-marks-entry', filters);
  const override = statuses.find(row => row.panelName === 'Override');
  assert.equal(override.totalProjects, 1); assert.equal(override.marksSubmitted, 1); assert.equal(override.pending, 0); assert.equal(override.status, 'Completed');
  assert.equal(statuses.find(row => row.panelName === 'Main').marksSubmitted, 0);
});
