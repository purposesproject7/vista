import { canonicalContext, contextFields, contextValue, readMasterContext } from './academicContext.js';
const sameContext = (left, right, master) => {
  const a = canonicalContext(left, master, { strict: false });
  const b = canonicalContext(right, master, { strict: false });
  return contextFields.every(field => contextValue(a[field]) === contextValue(b[field]));
};

export async function validateStudentAssignment() {
  if (this.isNew || !contextFields.some(field => this.isModified(field))) return;
  const Project = this.constructor.db.models.Project;
  if (!Project) return;
  const master = await readMasterContext();
  const projects = await Project.collection.find({ students: this._id, status: 'active' }).toArray();
  if (projects.some(project => !sameContext(this, project, master))) throw new Error("Student context must match the active project. Move the team through an explicit context migration rather than changing one member's programme/year.");
}

export async function validateProjectAssignments() {
  if (![...contextFields, 'students', 'panel', 'reviewPanels'].some(field => this.isModified(field))) return;
  const Student = this.constructor.db.models.Student;
  const Panel = this.constructor.db.models.Panel;
  const master = await readMasterContext();
  const studentIds = this.students.map(student => student._id || student);
  if (new Set(studentIds.map(String)).size !== studentIds.length) throw new Error('A student cannot occur twice in a project.');
  if (Student && studentIds.length) {
    const students = await Student.collection.find({ _id: { $in: studentIds } }).toArray();
    if (students.length !== studentIds.length || students.some(student => !sameContext(student, this, master))) throw new Error('Every project member must exist in the same school, programme and academic year.');
  }
  const panelIds = [this.panel, ...(this.reviewPanels || []).map(assignment => assignment.panel)].filter(Boolean).map(panel => panel._id || panel);
  if (Panel && panelIds.length) {
    const uniqueIds = [...new Map(panelIds.map(id => [String(id), id])).values()];
    const panels = await Panel.collection.find({ _id: { $in: uniqueIds } }).toArray();
    if (panels.length !== uniqueIds.length || panels.some(panel => !sameContext(panel, this, master))) throw new Error('Project panels must exist in the same school, programme and academic year.');
  }
}
