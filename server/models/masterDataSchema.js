import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const programSchema = new mongoose.Schema(
  {
    school: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const academicYearSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, unique: true }, // "2024-2025"
    isActive: { type: Boolean, default: true },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: true }
);

const masterDataSchema = new mongoose.Schema(
  {
    schools: [schoolSchema],
    programs: [programSchema],
    academicYears: [academicYearSchema],
  },
  { timestamps: true }
);

masterDataSchema.index({ "schools.name": 1 });
masterDataSchema.index({ "schools.code": 1 });
masterDataSchema.index({ "programs.school": 1, "programs.name": 1 });
masterDataSchema.index({ "programs.school": 1, "programs.code": 1 });

// School/programme aliases are identifiers. Prevent ambiguous mappings and
// orphaning existing records through an ordinary metadata edit.
masterDataSchema.pre("validate", async function() {
  const value = item => String(item || '').trim().toLowerCase();
  const seenSchools = new Map(), seenPrograms = new Map(), seenYears = new Set();
  for (const school of this.schools) {
    school.name = String(school.name ?? '').trim(); school.code = String(school.code ?? '').trim();
    for (const alias of new Set([value(school.name), value(school.code)])) {
      if (seenSchools.has(alias)) throw new Error(`Duplicate school name/code: ${alias}`);
      seenSchools.set(alias, school);
    }
  }
  for (const program of this.programs) {
    const school = seenSchools.get(value(program.school));
    if (!school) throw new Error(`Programme ${program.name} references an unknown school.`);
    program.school = school.code;
    program.name = String(program.name ?? '').trim(); program.code = String(program.code ?? '').trim();
    for (const alias of new Set([value(program.name), value(program.code)])) {
      const key = `${value(school.code)}:${alias}`;
      if (seenPrograms.has(key)) throw new Error(`Duplicate programme name/code in ${school.code}: ${alias}`);
      seenPrograms.set(key, program);
    }
  }
  for (const year of this.academicYears) {
    year.year = String(year.year ?? '').trim();
    if (seenYears.has(value(year.year))) throw new Error(`Duplicate academic year: ${year.year}`);
    seenYears.add(value(year.year));
  }
  if (this.academicYears.filter(year => year.isCurrent).length > 1) throw new Error("Only one academic year can be current.");
  if (this.isNew) return;
  const previous = await this.constructor.collection.findOne({ _id: this._id });
  if (!previous) return;
  const escape = item => String(item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [list, field, names] of [['schools', 'school', ['name', 'code']], ['programs', 'program', ['name', 'code', 'school']], ['academicYears', 'academicYear', ['year']]]) {
    for (const old of previous[list] || []) {
      const current = this[list].find(item => String(item._id) === String(old._id));
      if (current && names.every(name => value(old[name]) === value(current[name]))) continue;
      const aliases = field === 'academicYear' ? [old.year] : [old.name, old.code];
      if (field === 'school' && (previous.programs || []).some(program => aliases.some(alias => value(alias) === value(program.school)))) throw new Error("School identifiers are in use by programmes. Deactivate the school or migrate its references before renaming/removing it.");
      const query = { [field]: { $in: aliases.map(alias => new RegExp(`^\\s*${escape(alias)}\\s*$`, 'i')) } };
      if (field === 'program') {
        const school = (previous.schools || []).find(item => [item.name, item.code].some(alias => value(alias) === value(old.school)));
        query.school = { $in: [old.school, school?.name, school?.code].filter(Boolean).map(alias => new RegExp(`^\\s*${escape(alias)}\\s*$`, 'i')) };
      }
      for (const model of Object.values(mongoose.models)) {
        if (model === this.constructor || !model.schema.path(field)) continue;
        if (await model.collection.findOne(query, { projection: { _id: 1 } })) throw new Error(`${field} identifiers are in use. Deactivate the entry or migrate references before renaming/removing it.`);
      }
    }
  }
});

const MasterData = mongoose.model("MasterData", masterDataSchema);
export default MasterData;
