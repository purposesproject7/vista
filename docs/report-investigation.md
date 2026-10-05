# Report investigation and fix — 5 October 2026

The hosted API was inspected with the supplied admin account. All 12 Excel
report types were queried for each of the five configured SCOPE programmes for
Fall Semester 2026-27 (60 requests). Only aggregate counts are recorded here.
Production records were not modified.

## Confirmed cause

`MarksService.submitMarks` selected the evaluating faculty's first programme.
326 faculty profiles list IDP, even when their projects belong to other
programmes. Consequently **all 6,931 marks were labelled IDP**, while their
referenced students and projects establish the following actual distribution:

| Actual programme | Students | Actual marks | Marks stored under that programme | Assigned guides |
| --- | ---: | ---: | ---: | ---: |
| IDP | 2,845 | 4,479 | 6,931 | — |
| B.Tech | 1,973 | 2,139 | 0 | 309 |
| M.Tech Software Engineering | 255 | 131 | 0 | 165 |
| M.TECH(2 yrs) | 57 | 83 | 0 | 52 |
| MCA(II Year) | 70 | 99 | 0 | 62 |

That is **2,452 incorrectly labelled marks**, including 2,139 for B.Tech.
Filtering the duplicated `Marks.program` field excluded those marks from their
own programmes and included them in IDP's marks reports. Filtering
`Faculty.program` excluded assigned guides: the B.Tech workload report showed
only two faculty despite 309 assigned guides.

The previously reported empty **comprehensive** response was not reproducible
at inspection time: B.Tech returned 1,973 rows. The repository already contained
programme name/code and regex escaping fixes in commits `32ed869` and
`9778aac`. The mismatched mark/faculty contexts remained reproducible.

## Live report counts before this patch

Counts below are rows, except the activity row which counts logs and the
distribution row which counts students contributing to the distribution.

| Report | IDP | B.Tech | M.Tech SE | M.Tech 2 yrs | MCA |
| --- | ---: | ---: | ---: | ---: | ---: |
| Master: students | 2,845 | 1,973 | 255 | 57 | 70 |
| Master: projects | 956 | 777 | 255 | 57 | 70 |
| Master: marks | 6,931 | 0 | 0 | 0 | 0 |
| Students by marks range | 4,350 | 0 | 0 | 0 | 0 |
| Panel marks entry | 96 | 117 | 0 | 10 | 12 |
| Guide-wise students | 2,836 | 1,969 | 255 | 57 | 70 |
| Comprehensive marks | 2,845 | 1,973 | 255 | 57 | 70 |
| Faculty workload | 326 | 2 | 0 | 0 | 0 |
| Pending marks | 284 | 406 | 124 | 8 | 15 |
| Marks distribution | 4,350 | 0 | 0 | 0 | 0 |
| Student complete details | 2,845 | 1,973 | 255 | 57 | 70 |
| Faculty activity logs | 9,895 | 0 | 0 | 0 | 0 |
| Team details | 956 | 777 | 255 | 57 | 70 |
| PPT approval status | 956 | 777 | 255 | 57 | 70 |

No panel records exist for M.Tech Software Engineering, so an empty panel-only
report for that programme is legitimate.

## Implementation

- Marks creation and updates take school, programme and year from the student.
- Marks range, distribution and master exports filter through selected student
  IDs. Historical mislabelled marks therefore work without a database migration.
  Exported master marks show their student's actual context.
- Faculty reports include actual project guides and panel members, even when
  their profiles list another programme. Separate admin marks/workload APIs and
  admin/coordinator overview/workload APIs use the same context logic.
- School and programme names/codes resolve together within the selected school.
  Regex filters escape punctuation and tolerate case and surrounding whitespace.
- Activity reports resolve historical marks-linked log context through the mark's
  student before filtering. Both `year` and `academicYear` are supported.
  New mark/PPT/draft activities record the actual context and entity reference.
  Historical activities without a recoverable entity reference retain their
  original context; no year or programme is invented for generic login events.
- Empty row reports display a message instead of downloading an empty workbook
  and claiming success. Master exports ignore stale programme/year UI filters.
- School-admin scoping now persists with Express 5's query getter, including
  master exports. The existing scope test now checks that feature locks remain
  unchanged rather than assuming there are no default locks.
- The npm test command uses an explicit test-file glob compatible with Node 22.

## Validation and deployment

Regression coverage exercises all 12 report types using programme names and
codes, historical IDP-labelled marks, year/school isolation, new marks and updates,
approval/activity context, Excel serialization, separate report APIs and school
admin export restrictions. All **37 server tests pass** using a throwaway local
MongoDB database whose name ends in `_feature_test`. The client production build
and `git diff --check` pass.

Changes are in the local checkout. Production deployment access was not supplied.
On the existing production checkout, after applying these changes and retaining
its existing environment/configuration, rebuild the affected services:

```sh
docker compose up -d --build server client
```

After deployment, generate B.Tech comprehensive, marks range, distribution,
workload and activity reports for SCOPE / Fall Semester 2026-27. Check other
programmes and IDP as well: IDP's marks counts should exclude marks belonging to
other programmes. A database rewrite is not required for these reports.
