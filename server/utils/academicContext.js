import MasterData from "../models/masterDataSchema.js";

export const contextFields = ["school", "program", "academicYear"];
export const contextValue = value => String(value ?? "").trim().toLowerCase();
export const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const exactContextRegex = value => new RegExp(`^\\s*${escapeRegex(String(value).trim())}\\s*$`, "i");
export const isAllContext = value => ["all", "all programs", "all programmes", "all schools", "all years"].includes(contextValue(value));

export function contextError(message) {
  const error = new Error(message);
  error.name = "AcademicContextError";
  error.statusCode = 409;
  return error;
}

function matches(condition, candidate) {
  if (typeof condition === "string") return contextValue(condition) === contextValue(candidate);
  if (condition instanceof RegExp) return new RegExp(condition.source, condition.flags.replace(/[gy]/g, "")).test(String(candidate));
  if (Array.isArray(condition)) return condition.some(value => matches(value, candidate));
  if (condition?.$in) return matches(condition.$in, candidate);
  if (condition?.$eq !== undefined) return matches(condition.$eq, candidate);
  if (condition?.$regex) return matches(condition.$regex instanceof RegExp ? condition.$regex : new RegExp(condition.$regex, condition.$options || ""), candidate);
  return false;
}

function valuesOf(condition) {
  if (typeof condition === "string" || condition instanceof RegExp) return [condition];
  if (Array.isArray(condition)) return condition;
  if (condition?.$in) return condition.$in;
  if (condition?.$eq !== undefined) return [condition.$eq];
  if (condition?.$regex) return [condition.$regex instanceof RegExp ? condition.$regex : new RegExp(condition.$regex, condition.$options || "")];
  return null;
}

export function hasAcademicContext(query) {
  return query && typeof query === "object" && (
    contextFields.some(field => query[field] !== undefined) ||
    ["$and", "$or", "$nor"].some(key => query[key]?.some(hasAcademicContext))
  );
}

// Exact aliases only: B.Tech must never match B.Tech CSE or another school.
export function expandContextQuery(query, masterData = {}) {
  const output = { ...query };
  const schools = masterData?.schools || [];
  const programs = masterData?.programs || [];
  for (const field of contextFields) {
    if (query[field] === undefined) continue;
    const selected = valuesOf(query[field]);
    if (!selected) continue; // Preserve intentional operators such as $exists/$ne.
    if (selected.some(isAllContext)) { delete output[field]; continue; }
    const aliases = [];
    if (field === "school") {
      for (const school of schools) {
        if ([school.code, school.name].some(value => matches(query.school, value))) aliases.push(school.code, school.name);
      }
    } else if (field === "program") {
      const selectedSchools = schools.filter(school => [school.code, school.name].some(value => matches(query.school, value)));
      const schoolAliases = selectedSchools.flatMap(school => [school.code, school.name]);
      for (const program of programs) {
        const inSchool = query.school === undefined || isAllContext(query.school) ||
          schoolAliases.some(value => contextValue(value) === contextValue(program.school)) || matches(query.school, program.school);
        if (inSchool && [program.code, program.name].some(value => matches(query.program, value))) aliases.push(program.code, program.name);
      }
    }
    const strings = [...new Set([...selected.filter(value => typeof value === "string"), ...aliases].map(value => String(value).trim()))];
    const expressions = [...strings.map(exactContextRegex), ...selected.filter(value => value instanceof RegExp)];
    output[field] = expressions.length === 1 ? expressions[0] : { $in: expressions };
  }
  for (const key of ["$and", "$or", "$nor"]) {
    if (Array.isArray(query[key])) output[key] = query[key].map(branch => expandContextQuery({
      ...(query.school !== undefined ? { school: query.school } : {}), ...branch,
    }, masterData));
  }
  return output;
}

export function canonicalContext(context, masterData = {}, { strict = true } = {}) {
  const output = {};
  const schools = masterData?.schools || [];
  const programs = masterData?.programs || [];
  const years = masterData?.academicYears || [];
  let selectedSchool;
  if (context.school !== undefined) {
    selectedSchool = schools.find(school => [school.code, school.name].some(value => contextValue(value) === contextValue(context.school)));
    if (strict && schools.length && !selectedSchool) throw contextError(`Unknown school: ${context.school}`);
    output.school = selectedSchool?.name || String(context.school).trim();
  }
  if (context.program !== undefined) {
    const values = Array.isArray(context.program) ? context.program : [context.program];
    const canonical = values.map(value => {
      const choices = programs.filter(program =>
        [program.code, program.name].some(alias => contextValue(alias) === contextValue(value)) &&
        (!context.school || [context.school, selectedSchool?.code, selectedSchool?.name].some(school => contextValue(school) === contextValue(program.school)))
      );
      if (choices.length > 1 && new Set(choices.map(program => program.name)).size > 1) throw contextError(`Ambiguous programme: ${value}; select its school.`);
      if (strict && programs.length && !choices.length) throw contextError(`Programme ${value} does not belong to school ${output.school || context.school || "(not selected)"}.`);
      return choices[0]?.name || String(value).trim();
    });
    output.program = Array.isArray(context.program) ? [...new Set(canonical)] : canonical[0];
  }
  if (context.academicYear !== undefined) {
    const year = years.find(item => contextValue(item.year) === contextValue(context.academicYear));
    if (strict && years.length && !year) throw contextError(`Unknown academic year: ${context.academicYear}`);
    output.academicYear = year?.year || String(context.academicYear).trim();
  }
  return output;
}

export function validateMasterAliases(master = {}) {
  const schools = new Map(), programs = new Set(), years = new Set();
  for (const school of master.schools || []) {
    for (const alias of new Set([school.code, school.name].map(contextValue))) {
      if (schools.has(alias)) throw contextError('Conflicting school aliases exist in master data.');
      schools.set(alias, school);
    }
  }
  for (const program of master.programs || []) {
    const school = schools.get(contextValue(program.school));
    if (!school) throw contextError('A programme references an unknown school in master data.');
    for (const alias of new Set([program.code, program.name].map(contextValue))) {
      const key = `${contextValue(school.code)}|${alias}`;
      if (programs.has(key)) throw contextError('Conflicting programme aliases exist in master data.');
      programs.add(key);
    }
  }
  for (const year of master.academicYears || []) {
    if (years.has(contextValue(year.year))) throw contextError('Duplicate academic years exist in master data.');
    years.add(contextValue(year.year));
  }
}

export async function readMasterContext() {
  const records = await MasterData.find().select("schools programs academicYears").limit(2).lean();
  if (records.length > 1) throw contextError('Multiple master data documents exist. Resolve the conflicting metadata.');
  const master = records[0] || {};
  validateMasterAliases(master);
  return master;
}

function contextUpdateFields(update) {
  if (!update) return null;
  if (Array.isArray(update)) {
    if (JSON.stringify(update).match(/"(?:school|program|academicYear)(?:\.|"|\\)/)) throw contextError("Academic context must be updated with explicit values, not a pipeline.");
    return null;
  }
  for (const [operator, fields] of Object.entries(update)) {
    if (!operator.startsWith('$') || ['$set', '$setOnInsert'].includes(operator)) continue;
    if (fields && Object.keys(fields).some(path => contextFields.some(field => path === field || path.startsWith(field + '.')))) {
      throw contextError("Academic context must be replaced with complete explicit values using $set.");
    }
  }
  return [update, update.$set, update.$setOnInsert].some(hasAcademicContext) ? (update.$set || update) : null;
}

function literalQueryContext(query) {
  return Object.fromEntries(contextFields.filter(field => typeof query[field] === 'string').map(field => [field, query[field]]));
}

// Data boundaries cover controllers, services, uploads and bulk operations.
// MasterData itself deliberately does not install this plugin.
export function academicContextPlugin(schema, { uniqueContext = false, historical = false } = {}) {
  async function normalizeDocument() {
    if (historical || !contextFields.some(field => this.isModified(field))) return;
    const master = await readMasterContext();
    Object.assign(this, canonicalContext(this, master));
    if (uniqueContext && contextFields.every(field => this[field])) {
      const duplicate = await this.constructor.collection.findOne({
        ...expandContextQuery(Object.fromEntries(contextFields.map(field => [field, this[field]])), master),
        _id: { $ne: this._id },
      }, { projection: { _id: 1 } });
      if (duplicate) throw contextError("An equivalent school/programme/year configuration already exists. Update that configuration instead.");
    }
  }

  schema.pre("validate", normalizeDocument);
  schema.pre("save", normalizeDocument);

  schema.pre(["find", "findOne", "countDocuments", "distinct", "updateOne", "updateMany", "findOneAndUpdate", "findOneAndReplace", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"], async function() {
    const query = this.getFilter();
    const update = this.getUpdate?.();
    if (update && this.getOptions().upsert && !historical && hasAcademicContext(query)) {
      if (Array.isArray(update)) throw contextError('Context upserts require explicit values.');
      update.$setOnInsert = { ...literalQueryContext(query), ...update.$setOnInsert };
      for (const field of contextFields) if (update.$set?.[field] !== undefined) delete update.$setOnInsert[field];
    }
    const changed = !historical && contextUpdateFields(update);
    if (!hasAcademicContext(query) && !changed) return;
    const master = await readMasterContext();
    const expanded = expandContextQuery(query, master);
    this.setQuery(expanded);
    if (uniqueContext && this.op === "findOne" && contextFields.every(field => query[field] !== undefined)) {
      const matches = await this.model.collection.find(expanded).project({ _id: 1 }).limit(2).toArray();
      if (matches.length > 1) throw contextError("Conflicting configurations exist for equivalent school/programme/year values. Resolve them before continuing.");
    }
    if (changed && !historical) {
      if (Array.isArray(update)) throw contextError("Academic context must be updated with explicit values, not a pipeline.");
      const existing = await this.model.collection.findOne(expanded, { projection: { school: 1, program: 1, academicYear: 1 } });
      const fields = update.$set || update;
      if (this.op === 'updateMany' && contextFields.some(field => fields[field] === undefined)) {
        const contexts = await this.model.collection.aggregate([{ $match: expanded }, { $group: { _id: { school: '$school', program: '$program', academicYear: '$academicYear' } } }, { $limit: 2 }]).toArray();
        if (contexts.length > 1) throw contextError('Partial academic context updates must target one context at a time.');
      }
      const canonical = canonicalContext({ ...(existing || literalQueryContext(query)), ...(update.$setOnInsert || {}), ...fields }, master);
      for (const field of contextFields) {
        if (fields[field] !== undefined) fields[field] = canonical[field];
        if (update.$setOnInsert?.[field] !== undefined) update.$setOnInsert[field] = canonical[field];
      }
      if (uniqueContext && contextFields.every(field => canonical[field])) {
        const duplicate = await this.model.collection.findOne({ ...expandContextQuery(canonical, master), ...(existing ? { _id: { $ne: existing._id } } : {}) }, { projection: { _id: 1 } });
        if (duplicate) throw contextError('An equivalent school/programme/year configuration already exists.');
      }
      this.setUpdate(update);
      this.setOptions({ runValidators: true });
    }
  });

  schema.pre("insertMany", async function(documents) {
    if (historical) return;
    const master = await readMasterContext();
    for (const document of documents) Object.assign(document, canonicalContext(document, master));
  });
  schema.pre("bulkWrite", async function(operations) {
    const master = await readMasterContext();
    for (const operation of operations) {
      if (operation.insertOne && !historical) Object.assign(operation.insertOne.document, canonicalContext(operation.insertOne.document, master));
      for (const key of ["updateOne", "updateMany", "replaceOne", "deleteOne", "deleteMany"]) {
        const entry = operation[key];
        if (!entry) continue;
        const originalFilter = entry.filter;
        entry.filter = expandContextQuery(entry.filter, master);
        if (entry.replacement && !historical) Object.assign(entry.replacement, canonicalContext(entry.replacement, master));
        if (entry.upsert && entry.update && !historical && hasAcademicContext(originalFilter)) {
          if (Array.isArray(entry.update)) throw contextError('Context upserts require explicit values.');
          entry.update.$setOnInsert = { ...literalQueryContext(originalFilter), ...entry.update.$setOnInsert };
          for (const field of contextFields) if (entry.update.$set?.[field] !== undefined) delete entry.update.$setOnInsert[field];
        }
        const fields = !historical && contextUpdateFields(entry.update);
        if (fields && !historical) {
          const existing = await this.collection.findOne(entry.filter, { projection: { school: 1, program: 1, academicYear: 1 } });
          const canonical = canonicalContext({ ...(existing || literalQueryContext(originalFilter)), ...(entry.update.$setOnInsert || {}), ...fields }, master);
          for (const field of contextFields) {
            if (fields[field] !== undefined) fields[field] = canonical[field];
            if (entry.update.$setOnInsert?.[field] !== undefined) entry.update.$setOnInsert[field] = canonical[field];
          }
        }
      }
    }
  });
}
