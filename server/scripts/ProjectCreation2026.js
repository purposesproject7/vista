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

import xlsx from "xlsx";

const INPUT_FILE = "New__MULTIDISCIPLINARY PROJECT OPEN HOUSE_PANEL DETAILS_latest_updated_28th March 2026.xlsx";
const OUTPUT_FILE = "Projects_Template.xlsx";

// Read file
const workbook = xlsx.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// Group by Guide + Project Title
const grouped = {};

for (const row of data) {
  const guideId = row["Guide Employee Id"];
  let projectTitle = row["Project Title"] || row["project title"] || "N/A";
  const regNo = row["Student Register No"];

  if (!guideId || !regNo) continue;

  projectTitle = projectTitle.trim();
  const key = `${guideId}__${projectTitle}`;

  if (!grouped[key]) {
    grouped[key] = {
      guideId,
      projectTitle,
      students: []
    };
  }

  grouped[key].students.push(regNo);
}

// Build output
const output = [];

for (const key in grouped) {
  const { guideId, projectTitle, students } = grouped[key];

  for (let i = 0; i < students.length; i += 5) {
    const team = students.slice(i, i + 5);

    let finalName = projectTitle;
    if (!finalName || finalName.toUpperCase() === "N/A" || finalName === "NA") {
      finalName = team[0];
    }

    output.push({
      name: finalName,
      guideFacultyEmpId: guideId,
      "teamMembers": team.join(","),
      type: "software",
      specialization: "General"
    });
  }
}

// ✅ Write to SINGLE sheet
const newWorkbook = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet(output);

xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Projects");

xlsx.writeFile(newWorkbook, OUTPUT_FILE);

console.log("✅ Done! All data written to single sheet.");