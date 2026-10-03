// // Usage: node convert_to_students.js
// // Make sure package.json has: { "type": "module" }
// // Install: npm install xlsx

// import xlsx from "xlsx";
// import path from "path";
// import { fileURLToPath } from "url";

// // Fix __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const SOURCE_FILE = path.join(
//   __dirname,
//   "New__MULTIDISCIPLINARY PROJECT OPEN HOUSE_PANEL DETAILS_latest_updated_28th March 2026.xlsx"
// );

// const OUTPUT_FILE = path.join(__dirname, "Students_Filled.xlsx");

// // ── 1. Load source file ───────────────────────────────────────────────────────
// let workbook;
// try {
//   workbook = xlsx.readFile(SOURCE_FILE);
// } catch (err) {
//   console.error(`❌ Cannot read source file: ${SOURCE_FILE}`);
//   console.error(err.message);
//   process.exit(1);
// }

// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

// // ── 2. Helper — random 10-digit Indian mobile number starting with 9 ──────────
// function randomPhone() {
//   let num = "9";
//   for (let i = 0; i < 9; i++) {
//     num += Math.floor(Math.random() * 10);
//   }
//   return num;
// }

// // ── 3. Deduplicate by regNo and build output rows ─────────────────────────────
// const seen = new Set();
// const outputRows = [];

// for (const row of rows) {
//   const regNo = String(row["Student Register No"] ?? "").trim();
//   const name = String(row["Student Name"] ?? "").trim();

//   // skip blank or duplicate
//   if (!regNo || regNo === "undefined" || seen.has(regNo)) continue;

//   seen.add(regNo);

//   outputRows.push({
//     regNo,
//     name,
//     emailId: `${regNo.toLowerCase()}@vitstudent.ac.in`,
//     phoneNumber: randomPhone(),
//     PAT: "FALSE",
//   });
// }

// // ── 4. Write output Excel ─────────────────────────────────────────────────────
// const headers = ["regNo", "name", "emailId", "phoneNumber", "PAT"];
// const newSheet = xlsx.utils.json_to_sheet(outputRows, { header: headers });

// const newWorkbook = xlsx.utils.book_new();
// xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Students");

// try {
//   xlsx.writeFile(newWorkbook, OUTPUT_FILE);
// } catch (err) {
//   console.error(`❌ Cannot write output file: ${OUTPUT_FILE}`);
//   console.error(err.message);
//   process.exit(1);
// }

// // ── 5. Summary ────────────────────────────────────────────────────────────────
// console.log(`✅ Done! Saved to ${OUTPUT_FILE}`);
// console.log(`   Total students written : ${outputRows.length}`);

// console.log(`\nSample rows:`);
// outputRows.slice(0, 3).forEach((r) => {
//   console.log(" ", JSON.stringify(r));
// });

// UPDATED SCRIPT FOR 2026-27 FALL PJT1

import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_FILE = path.join(__dirname, "Project Registration List.xlsx");
const TEMPLATE_FILE = path.join(__dirname, "Students_Template.xlsx");
const OUTPUT_FILE = path.join(__dirname, "Students_Template_Filled.xlsx");

// Read workbook
const projectWorkbook = XLSX.readFile(PROJECT_FILE);
const projectSheet =
  projectWorkbook.Sheets[projectWorkbook.SheetNames[0]];

const projectData = XLSX.utils.sheet_to_json(projectSheet);

// Generate random Indian phone number starting with 9
function generatePhoneNumber() {
  let phone = "9";

  for (let i = 0; i < 9; i++) {
    phone += Math.floor(Math.random() * 10);
  }

  return phone;
}

// Prepare output data
const students = projectData.map((student) => {
  const regNo = String(student["REG NUMBER"]).trim();
  const name = String(student["STUDENT NAME"]).trim();

  return {
    regNo,
    name,
    emailId: `${regNo}@vitstudent.ac.in`,
    phoneNumber: generatePhoneNumber(),
    PAT: false,
  };
});

// Read template workbook
const templateWorkbook = XLSX.readFile(TEMPLATE_FILE);
const templateSheetName = templateWorkbook.SheetNames[0];

// Replace sheet contents while keeping headers
const newSheet = XLSX.utils.json_to_sheet(students, {
  header: ["regNo", "name", "emailId", "phoneNumber", "PAT"],
});

templateWorkbook.Sheets[templateSheetName] = newSheet;

// Save output
XLSX.writeFile(templateWorkbook, OUTPUT_FILE);

console.log(`Done! Generated ${students.length} students.`);
console.log(`Saved to ${OUTPUT_FILE}`);