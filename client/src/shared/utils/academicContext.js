export const contextValue = value => String(value ?? '').trim().toLowerCase();
export const sameContextValue = (left, right) => contextValue(left) === contextValue(right);
export const findSchool = (schools, value) => (schools || []).find(s => [s.code, s.name].some(alias => sameContextValue(alias, value)));
export function schoolMatches(left, right, schools) {
  const school = findSchool(schools, right);
  return [right, school?.code, school?.name].filter(Boolean).some(value => sameContextValue(left, value));
}
export const programsForSchool = (programs, school, schools) => (programs || []).filter(p => schoolMatches(p.school, school, schools));
export function normalizeMasterData(data) {
  if (!data?.schools || !data?.programs) return data;
  return { ...data, programs: data.programs.map(p => ({ ...p, school: findSchool(data.schools, p.school)?.code || p.school })) };
}
