// import xlsx from "xlsx";

// const INPUT_FILE = "New__MULTIDISCIPLINARY PROJECT OPEN HOUSE_PANEL DETAILS_latest_updated_28th March 2026.xlsx";
// const OUTPUT_FILE = "Projects_Template.xlsx";

// // Read file
// const workbook = xlsx.readFile(INPUT_FILE);
// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = xlsx.utils.sheet_to_json(sheet);

// // Group by Guide + Project Title
// const grouped = {};

// for (const row of data) {
//   const guideId = row["Guide Employee Id"];
//   let projectTitle = row["Project Title"] || row["project title"] || "N/A";
//   const regNo = row["Student Register No"];

//   if (!guideId || !regNo) continue;

//   projectTitle = projectTitle.trim();
//   const key = `${guideId}__${projectTitle}`;

//   if (!grouped[key]) {
//     grouped[key] = {
//       guideId,
//       projectTitle,
//       students: []
//     };
//   }

//   grouped[key].students.push(regNo);
// }

// // Build output
// const output = [];

// for (const key in grouped) {
//   const { guideId, projectTitle, students } = grouped[key];

//   for (let i = 0; i < students.length; i += 5) {
//     const team = students.slice(i, i + 5);

//     let finalName = projectTitle;
//     if (!finalName || finalName.toUpperCase() === "N/A" || finalName === "NA") {
//       finalName = team[0];
//     }

//     output.push({
//       name: finalName,
//       guideFacultyEmpId: guideId,
//       "Team Members": team.join(","),
//       type: "software",
//       specialization: "General"
//     });
//   }
// }

// // Distribute into 4 sheets
// const sheetSize = Math.ceil(output.length / 4);
// const sheets = {
//   "Sheet1": output.slice(0, sheetSize),
//   "Sheet2": output.slice(sheetSize, sheetSize * 2),
//   "Sheet3": output.slice(sheetSize * 2, sheetSize * 3),
//   "Sheet4": output.slice(sheetSize * 3)
// };

// // Write to Excel
// const newWorkbook = xlsx.utils.book_new();

// for (const [sheetName, sheetData] of Object.entries(sheets)) {
//   const newSheet = xlsx.utils.json_to_sheet(sheetData);
//   xlsx.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
// }

// xlsx.writeFile(newWorkbook, OUTPUT_FILE);

// console.log("✅ Done! Data distributed into 4 sheets.");

// import xlsx from "xlsx";

// const INPUT_FILE = "New__MULTIDISCIPLINARY PROJECT OPEN HOUSE_PANEL DETAILS_latest_updated_28th March 2026.xlsx";
// const OUTPUT_FILE = "Projects_Template.xlsx";

// // Read file
// const workbook = xlsx.readFile(INPUT_FILE);
// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = xlsx.utils.sheet_to_json(sheet);

// // Group by Guide + Project Title
// const grouped = {};

// for (const row of data) {
//   const guideId = row["Guide Employee Id"];
//   let projectTitle = row["Project Title"] || row["project title"] || "N/A";
//   const regNo = row["Student Register No"];

//   if (!guideId || !regNo) continue;

//   projectTitle = projectTitle.trim();
//   const key = `${guideId}__${projectTitle}`;

//   if (!grouped[key]) {
//     grouped[key] = {
//       guideId,
//       projectTitle,
//       students: []
//     };
//   }

//   grouped[key].students.push(regNo);
// }

// // Build output
// const output = [];

// for (const key in grouped) {
//   const { guideId, projectTitle, students } = grouped[key];

//   for (let i = 0; i < students.length; i += 5) {
//     const team = students.slice(i, i + 5);

//     let finalName = projectTitle;
//     if (!finalName || finalName.toUpperCase() === "N/A" || finalName === "NA") {
//       finalName = team[0];
//     }

//     output.push({
//       name: finalName,
//       guideFacultyEmpId: guideId,
//       "teamMembers": team.join(","),
//       type: "software",
//       specialization: "General"
//     });
//   }
// }

// // ✅ Write to SINGLE sheet
// const newWorkbook = xlsx.utils.book_new();
// const newSheet = xlsx.utils.json_to_sheet(output);

// xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Projects");

// xlsx.writeFile(newWorkbook, OUTPUT_FILE);

// console.log("✅ Done! All data written to single sheet.");

//2026-27 FALL PJT1

import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "Project Registration List.xlsx");
const OUTPUT_FILE = path.join(__dirname, "Projects_Template.xlsx");

// Read input workbook
const workbook = xlsx.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Rows Read: ${data.length}`);

// Group by Guide + Project Title
const grouped = {};

for (const row of data) {
  const regNo = String(row["REG NUMBER"] ?? "").trim();
  const guideEmpId = String(row["GUIDE ERP ID"] ?? "").trim();
  let projectTitle = String(row["PROJECT TITLE"] ?? "").trim();

  if (!regNo || !guideEmpId) continue;

  // If project title is blank, use first student's reg no later
  const key = `${guideEmpId}__${projectTitle}`;

  if (!grouped[key]) {
    grouped[key] = {
      guideEmpId,
      projectTitle,
      students: [],
    };
  }

  grouped[key].students.push(regNo);
}

// Create output
const output = [];

for (const group of Object.values(grouped)) {
  let projectName = group.projectTitle;

  if (
    !projectName ||
    projectName.toUpperCase() === "NA" ||
    projectName.toUpperCase() === "N/A"
  ) {
    projectName = group.students[0];
  }

  // Split into teams of max 5 students
  for (let i = 0; i < group.students.length; i += 5) {
    const team = group.students.slice(i, i + 5);

    output.push({
      name: projectName,
      guideFacultyEmpId: group.guideEmpId,
      teamMembers: team.join(","),
      type: "software",
      specialization: "General",
    });
  }
}

console.log(`Projects Generated: ${output.length}`);

// Create workbook
const outWorkbook = xlsx.utils.book_new();
const outSheet = xlsx.utils.json_to_sheet(output, {
  header: [
    "name",
    "guideFacultyEmpId",
    "teamMembers",
    "type",
    "specialization",
  ],
});

xlsx.utils.book_append_sheet(outWorkbook, outSheet, "Projects");

xlsx.writeFile(outWorkbook, OUTPUT_FILE);

console.log(`✅ Saved to ${OUTPUT_FILE}`);