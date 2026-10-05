# Academic context and review audit

Date: 5 October 2026. Changes are in the local checkout; production has not been deployed or migrated by this audit.

## Confirmed cause of the faculty screenshot

There are two separate issues:

1. The screenshot is in **Guide** mode. The configured **Review 3** is a **panel** evaluation. Its window is 15 September–10 October 2026 and its active flag is true. Hiding panel grading controls from a guide is intentional, but the generic “No active reviews” message was misleading. The dashboard now explains that Review 3 is open for panel evaluation and directs the faculty to Panel mode. Guide PPT approvals remain available when configured.
2. Live, authenticated, read-only admin requests confirmed a context mismatch: `SCOPE / B.Tech / Fall Semester 2026-27` returned the schema and component library, while `SCOPE / B.TECH / Fall Semester 2026-27` returned 404. The programme name/code boundary was not handled consistently.

The inspected account, employee ID 52275, lists IDP in its profile. Faculty evaluation access must therefore follow actual guide/panel assignments, rather than assuming the first profile programme is the programme being evaluated. No faculty password was changed and no production account was impersonated.

## Changes

| Area | Issue | Result |
|---|---|---|
| Academic context | Case, whitespace, school names/codes and programme names/codes were handled differently across endpoints. Some filters used substring matching. | A common Mongoose boundary expands configured exact aliases on reads and stores canonical school/programme names and academic-year titles on writes. B.Tech cannot match B.Tech CSE, and programme aliases stay constrained to their school. |
| Data writes | Individual services, uploads and bulk operations could store incompatible context strings. | Validation covers document validation/save, insertMany, query updates, replacements, upserts and bulkWrite. Unknown programmes, unknown years and programmes belonging to another school are rejected when master metadata is configured. Unsupported context operators are rejected. Upserts explicitly store context values rather than relying on regex filters. |
| Legacy configuration conflicts | Equivalent rubric/library/team configurations could coexist under different aliases. | Equivalent configurations are blocked on ordinary document creation/editing; lookup conflicts return an explicit error instead of choosing an arbitrary schema. Conflicting master aliases or multiple master documents are also rejected on context reads. |
| Master data | Duplicate case-insensitive aliases, dangling programme-school links and destructive identifier edits were possible. | Master-data validation checks aliases, school links and the current-year flag. Ordinary rename/remove operations cannot orphan identifiers used by academic records; deactivation remains available. |
| Review identities | The old suffix remover collapsed “Review 1” and “Review 2” to the same normalized value. Generated IDs and legacy labels also differed across features. | Review numbers remain distinct; supported Roman/Arabic legacy labels resolve to stable IDs. Different generated IDs stay distinct. Ambiguous labels fail explicitly. Client/server identity contracts are tested together while retaining independent Docker build contexts. |
| Rubric editing | Coordinator saves bypassed admin service validation, and changing IDs could orphan marks, requests and assignments. | Coordinator and admin paths share validation. Review-only saves preserve contribution settings. Duplicate review IDs, invalid windows and invalid component maxima are rejected. Referenced IDs cannot be renamed/deleted; display names can be edited and reviews can be deactivated. |
| Faculty dashboard | Failed rubric requests were converted to empty reviews; incomplete selectors triggered requests; old responses could replace a new context. | Requests wait for complete context, cancel on changes, and discard stale results. Errors remain visible with Retry and the selector. Inactive reviews are excluded. Guide, panel and temporary-panel roles follow the selected evaluation mode. |
| Faculty rubric API | Component-library requests used an admin-only route. | Added a faculty GET endpoint and changed the faculty client to use it. Missing context/configuration has an explicit error response. |
| Defaults and selectors | The default year was hardcoded, school defaults could disagree with the account, and metadata school links used inconsistent shapes. | Defaults use the account school and configured current year. Metadata school links resolve to codes for dropdowns. Valid programme selections are retained. The coordinator scope includes the selected year and year options follow actual assignments. |
| Project lists | Guide/panel list methods deleted the requested academic year. | The selected year is preserved and enforced. |
| Imports | Project/student imports could select another year's student by registration number; mixed-context project batches shared the first row's caches/configuration. | Imports resolve students by year, split project batches by context and verify member context. |
| Student identity | Registration numbers are unique per year, but many reads and mutations assumed global uniqueness. | Ambiguous registration/email lookups fail explicitly. Student self-service uses authenticated identity; admin/coordinator service calls can supply year. |
| Team integrity | A normal edit could leave a student, project and panel in different contexts. | Document saves validate project members/panels and prevent moving one student out of an active team's context, including saves that skip ordinary validation. |
| Panel assignment | Raw context comparisons rejected aliases; some assignment paths omitted the year or let a specialization override bypass context checks. | Assignment/reassignment compares canonical school/programme/year. Bulk panel assignment is scoped to the coordinator/admin selection, selects a panel from the project's context and rejects ambiguous project/panel names. |
| Evaluation permissions | Guide membership took precedence over Panel mode; main-panel membership could grant access despite a review-specific replacement panel. | Requested guide/panel role is checked independently. A review-specific panel replaces the main panel for that review. Membership works through faculty references or employee IDs. |
| Marks | Foreign students, mismatched contexts, inactive/unconfigured reviews and inconsistent component totals could be accepted. | Service validation checks student-project membership/context, configured review/role, component identities/maxima and total sums. PPT is required only when configured. Student mark references use addToSet. |
| Requests | Programme filters matched faculty profiles, hiding requests involving an IDP-profile guide's B.Tech students. | Request lists filter the request/student context. New faculty requests use verified project membership, selected evaluation role and canonical review identity. |
| Student totals | Lists combined rubrics from different contexts; draft marks could count; both-role reviews used one document. | Each student uses their own rubric. Submitted guide marks plus the panel average form both-role totals; drafts do not contribute. |
| Report totals | Legacy review labels split equivalent reviews; submitted zero panel scores were excluded from mixed averages. | Report reads resolve legacy review IDs against the student's rubric, count submitted zero scores and exclude draft guide marks. Panel status reports count actual review-specific evaluator assignments and submitted marks, including employee-ID-only members. Faculty workload includes those members and uses the stored emailId. The prior fixes for all twelve report exports are retained. |
| Broadcasts | Exact string matching and profile-only programmes could miss assigned faculty. | Audience matching accepts configured aliases and includes actual guide/panel/coordinator assignment programmes. Faculty year-target behavior remains as before; student year targeting is enforced. |
| Sudo and school ownership | Force-PPT used a hardcoded sudo employee ID; ownership comparisons could reject a code/name equivalent. | Force-PPT uses the configured sudo identity, validates the configured review and matches existing approvals by review identity. Admin/coordinator ownership accepts exact configured aliases without granting unrelated contexts. |
| Maintenance | No central diagnostic existed, and one legacy email reproduction script had invalid JavaScript syntax. | Added the read-only audit command; repaired the script syntax without running it or sending mail. |

## Read-only database audit

From `server/`, run:

```sh
npm run audit-context
```

The command uses `AUDIT_MONGO_URI` when set, otherwise the deployment's `MONGO_URI`. Use an existing read-only database account for production inspection. It disables automatic collection/index creation and does not save, update or migrate any records.

The summary reports record counts, invalid/noncanonical contexts, duplicate equivalent configurations, repeated registrations across years, missing references, student/project context mismatches and unconfigured/ambiguous review references. It does not print credentials, student names, registration numbers or other row data. Test coverage verifies that legacy rows remain unchanged after inspection.

Noncanonical aliases alone are readable after these changes. Conflicting duplicate configurations, orphan references and genuinely incorrect assignments require a deliberate data repair; the application now reports or rejects those conditions rather than guessing. A migration is not included or run automatically.

## Verification

- 76 automated feature tests passed against an isolated local MongoDB database ending in `_feature_test`. This includes the original 37 tests and 39 new context/review regressions.
- Existing report coverage exercises all twelve report types through programme names and codes, including Excel serialization and legacy marks labelled IDP.
- New coverage includes the screenshot's Guide/Panel message, schema/library aliases, year isolation, data-write boundaries, generated review IDs, assignment permissions, foreign-context students/panels, independent student rubrics, zero-score averages, broadcast audiences and the read-only audit.
- Client production build passed. Existing Vite warnings about the `minify` output option and mixed static/dynamic API imports remain.
- All 176 server JavaScript files passed syntax checks; `git diff --check` passed.
- Production inspection was read-only. There was no deployment, production data mutation or production test submission.

## Deployment and practical limits

Deploy both the server and rebuilt client through the existing production release process. Production is documented as nginx/pm2; running the interactive Docker provisioning script locally is not a deployment to vista.vit.ac.in.

Before release, inspect the database audit summary and resolve conflicting configurations. After release, smoke-test the affected account in Guide and Panel modes, load B.Tech rubrics by both name and code, and export each programme's reports.

Compatibility remains for bootstrap databases with no master metadata and legacy marking contexts without a rubric: the new service checks enforce review/component definitions whenever a rubric exists. Existing historical logs and incorrectly labelled mark rows are read without silently migrating them. Raw MongoDB collection calls, aggregation pipelines and external maintenance tools remain outside normal Mongoose write validation; use the audit around deliberate migrations. Ordinary document/team configuration workflows and the application paths identified here are covered, but this audit is not a claim that every unrelated application defect has been eliminated.

The shared boundary deliberately reads fresh master metadata rather than retaining a potentially stale alias cache. This adds database reads to context operations; monitor query latency after release.
