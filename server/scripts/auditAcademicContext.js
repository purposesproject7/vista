// Read-only audit: uses raw collections, bypassing alias normalization, and
// reports counts/context identifiers only. It never saves or migrates records.
import 'dotenv/config';
import mongoose from 'mongoose';
import MasterData from '../models/masterDataSchema.js';
import Student from '../models/studentSchema.js';
import Faculty from '../models/facultySchema.js';
import Project from '../models/projectSchema.js';
import Marks from '../models/marksSchema.js';
import Request from '../models/requestSchema.js';
import Panel from '../models/panelSchema.js';
import MarkingSchema from '../models/markingSchema.js';
import ComponentLibrary from '../models/componentLibrarySchema.js';
import ProgramConfig from '../models/programConfigSchema.js';
import ProjectCoordinator from '../models/projectCoordinatorSchema.js';
import { canonicalContext, contextFields, contextValue, validateMasterAliases } from '../utils/academicContext.js';
import { resolveReview } from '../utils/reviewIdentity.js';
import { pathToFileURL } from 'node:url';

export async function auditAcademicContext() {
  const masters = await MasterData.collection.find({}).toArray();
  const master = masters[0] || {};
  const summary = { masterDocuments: masters.length, collections: {}, issues: {} };
  const issue = name => { summary.issues[name] = (summary.issues[name] || 0) + 1; };
  try { validateMasterAliases(master); } catch { issue('MasterData.conflictingAliases'); }
  const key = record => contextFields.map(field => contextValue(canonicalContext(record, master, { strict: false })[field])).join('|');
  const models = [Student, Faculty, Project, Marks, Request, Panel, MarkingSchema, ComponentLibrary, ProgramConfig, ProjectCoordinator];
  const rows = new Map();
  for (const model of models) {
    const documents = await model.collection.find({}, { projection: { _id: 1, school: 1, program: 1, academicYear: 1, regNo: 1, student: 1, students: 1, project: 1, guideFaculty: 1, faculty: 1, panel: 1, reviewType: 1, reviews: 1, reviewPanels: 1, pptApprovals: 1 } }).toArray();
    rows.set(model.modelName, documents);
    const counts = { records: documents.length, nonCanonicalContext: 0, invalidContext: 0 };
    for (const record of documents) {
      try {
        const canonical = canonicalContext(record, master);
        if (contextFields.some(field => record[field] !== undefined && JSON.stringify(record[field]) !== JSON.stringify(canonical[field]))) counts.nonCanonicalContext++;
      } catch { counts.invalidContext++; }
    }
    summary.collections[model.modelName] = counts;
  }
  const students = new Map(rows.get('Student').map(row => [String(row._id), row]));
  const projects = new Map(rows.get('Project').map(row => [String(row._id), row]));
  const schemas = new Map();
  for (const modelName of ['MarkingSchema', 'ComponentLibrary', 'ProgramConfig']) {
    const contexts = new Set();
    for (const record of rows.get(modelName)) {
      const contextKey = key(record);
      if (contexts.has(contextKey)) issue(`${modelName}.duplicateEquivalentContext`);
      contexts.add(contextKey);
      if (modelName === 'MarkingSchema') {
        schemas.set(contextKey, record);
        const reviewIds = new Set();
        for (const review of record.reviews || []) {
          if (reviewIds.has(review.reviewName)) issue('MarkingSchema.duplicateReviewId');
          reviewIds.add(review.reviewName);
        }
      }
    }
  }
  const registrations = new Set();
  for (const student of students.values()) {
    if (registrations.has(contextValue(student.regNo))) issue('Student.registrationAcrossYears');
    registrations.add(contextValue(student.regNo));
  }
  for (const project of projects.values()) {
    for (const id of project.students || []) {
      const student = students.get(String(id));
      if (!student) issue('Project.missingStudent');
      else if (key(student) !== key(project)) issue('Project.studentContextMismatch');
    }
    const schema = schemas.get(key(project));
    if (!schema) { issue('Project.missingMarkingSchema'); continue; }
    for (const reference of [...(project.reviewPanels || []), ...(project.pptApprovals || [])]) {
      try { if (!resolveReview(schema.reviews, reference.reviewType)) issue('Project.unconfiguredReviewReference'); }
      catch { issue('Project.ambiguousReviewReference'); }
    }
  }
  for (const modelName of ['Marks', 'Request']) {
    for (const record of rows.get(modelName)) {
      const student = students.get(String(record.student)), project = projects.get(String(record.project));
      if (!student) issue(`${modelName}.missingStudent`);
      else if (key(record) !== key(student)) issue(`${modelName}.studentContextMismatch`);
      if (!project) issue(`${modelName}.missingProject`);
      else if (!(project.students || []).some(id => String(id) === String(record.student))) issue(`${modelName}.studentOutsideProject`);
      const schema = project && schemas.get(key(project));
      if (schema) {
        try { if (!resolveReview(schema.reviews, record.reviewType)) issue(`${modelName}.unconfiguredReview`); }
        catch { issue(`${modelName}.ambiguousReview`); }
      }
    }
  }
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const uri = process.env.AUDIT_MONGO_URI || process.env.MONGO_URI;
    if (!uri) throw new Error('Set AUDIT_MONGO_URI or MONGO_URI to the database to inspect.');
    await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
    console.log(JSON.stringify(await auditAcademicContext(), null, 2));
  } catch (error) { console.error('Academic context audit failed:', error.name); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
