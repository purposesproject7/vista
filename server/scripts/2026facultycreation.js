// fill_faculty_from_projects.js
// Usage: node fill_faculty_from_projects.js
// npm install xlsx

// import XLSX from "xlsx";

// const INPUT_FILE = "New__MULTIDISCIPLINARY PROJECT OPEN HOUSE_PANEL DETAILS_latest_updated_28th March 2026a.xlsx";
// const OUTPUT_FILE = "Faculty_Template_Filled_Multi2026.xlsx";

// // Generate random phone number
// function randomIndianPhone() {
//   const secondDigit = Math.floor(Math.random() * 5); // 90–94
//   let number = "9" + secondDigit;
//   for (let i = 0; i < 8; i++) {
//     number += Math.floor(Math.random() * 10);
//   }
//   return number;
// }

// // Generate password
// function generatePassword(employeeId) {
//   return `Vit${employeeId}@123`;
// }

// // Read input file
// const wb = XLSX.readFile(INPUT_FILE);
// const ws = wb.Sheets[wb.SheetNames[0]];
// const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

// // Extract unique faculty
// const facultyMap = new Map();

// for (const row of rows) {
//   const empId = String(row["Guide Employee Id"] ?? "").trim();
//   const name = String(row["Guide Name"] ?? row["Faculty Name"] ?? "").trim(); // fallback

//   if (!empId) continue;

//   if (!facultyMap.has(empId)) {
//     facultyMap.set(empId, {
//       employeeId: empId,
//       name: name || "", // optional
//       phoneNumber: randomIndianPhone(),
//       password: generatePassword(empId),
//     });
//   }
// }

// // Convert to array
// const output = Array.from(facultyMap.values());

// // Create sheet
// const newWs = XLSX.utils.json_to_sheet(output);
// const newWb = XLSX.utils.book_new();

// XLSX.utils.book_append_sheet(newWb, newWs, "Faculty");

// // Write file
// XLSX.writeFile(newWb, OUTPUT_FILE);

// console.log(`✅ Done! Saved to ${OUTPUT_FILE}`);
// console.log(`   Unique faculty count: ${output.length}`);
// console.log("   Sample:", output[0]);


// 2026-27 PJT1 

import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "New Joining Faculty List.xlsx");
const OUTPUT_FILE = path.join(__dirname, "Faculty_Template_Filled.xlsx");

// Read workbook
const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Skip the title row. Row 2 becomes the header.
const rows = XLSX.utils.sheet_to_json(sheet, {
  range: 1,
  defval: "",
});

function generatePassword(empId) {
  return `Vit${empId}@123`;
}

const output = [];

for (const row of rows) {
  const employeeId = String(row["SL NO"] ?? "").trim();
  const name = String(row["Emp Id"] ?? "").trim();
  const phoneNumber = String(row["Mobile No"] ?? "").trim();
  const emailId = String(row["Email"] ?? "").trim();
  const specialization = String(row["Research Group"] ?? "").trim();

  if (!employeeId || !name) continue;

  output.push({
    name,
    employeeId,
    emailId,
    phoneNumber,
    specialization,
    password: generatePassword(employeeId),
    role: "FACULTY",
  });
}

const outWorkbook = XLSX.utils.book_new();
const outSheet = XLSX.utils.json_to_sheet(output, {
  header: [
    "name",
    "employeeId",
    "emailId",
    "phoneNumber",
    "specialization",
    "password",
    "role",
  ],
});

XLSX.utils.book_append_sheet(outWorkbook, outSheet, "Faculty");

XLSX.writeFile(outWorkbook, OUTPUT_FILE);

console.log(`✅ Faculty generated: ${output.length}`);
console.log(`📄 Saved as: ${OUTPUT_FILE}`);