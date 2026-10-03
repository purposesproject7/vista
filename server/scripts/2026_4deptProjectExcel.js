import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "Projects_Template_Filled.xlsx");

// Read workbook
const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const projects = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// Program mappings
const categories = {
  Projects_BTech: ["BAI", "BCE", "BDS", "BPS", "BRS"],
  Projects_MTech_5Yr_Integrated: ["MIA", "MIS"],
  Projects_MTech_2Yr: ["MML", "MCS", "MCB", "MAS", "MAI"],
  Projects_MCA_2Yr: ["MCA"],
};

const output = {
  Projects_BTech: [],
  Projects_MTech_5Yr_Integrated: [],
  Projects_MTech_2Yr: [],
  Projects_MCA_2Yr: [],
};

// Classify each project
for (const project of projects) {
  const teamMembers = String(project.teamMembers ?? "").trim();

  if (!teamMembers) continue;

  // First registration number
  const firstRegNo = teamMembers.split(",")[0].trim().toUpperCase();

  if (categories.Projects_BTech.some(code => firstRegNo.includes(code))) {
    output.Projects_BTech.push(project);
  } else if (
    categories.Projects_MTech_5Yr_Integrated.some(code =>
      firstRegNo.includes(code)
    )
  ) {
    output.Projects_MTech_5Yr_Integrated.push(project);
  } else if (
    categories.Projects_MTech_2Yr.some(code =>
      firstRegNo.includes(code)
    )
  ) {
    output.Projects_MTech_2Yr.push(project);
  } else if (
    categories.Projects_MCA_2Yr.some(code =>
      firstRegNo.includes(code)
    )
  ) {
    output.Projects_MCA_2Yr.push(project);
  }
}

// Helper function
function saveWorkbook(fileName, data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, "Projects");
  XLSX.writeFile(wb, path.join(__dirname, fileName));
}

// Save files
saveWorkbook("Projects_BTech.xlsx", output.Projects_BTech);
saveWorkbook(
  "Projects_MTech_5Yr_Integrated.xlsx",
  output.Projects_MTech_5Yr_Integrated
);
saveWorkbook("Projects_MTech_2Yr.xlsx", output.Projects_MTech_2Yr);
saveWorkbook("Projects_MCA_2Yr.xlsx", output.Projects_MCA_2Yr);

// Summary
console.log("======================================");
console.log("Projects Split Successfully");
console.log("======================================");
console.log(`BTech                : ${output.Projects_BTech.length}`);
console.log(
  `MTech 5 Yr Integrated: ${output.Projects_MTech_5Yr_Integrated.length}`
);
console.log(`MTech 2 Yr           : ${output.Projects_MTech_2Yr.length}`);
console.log(`MCA 2 Yr             : ${output.Projects_MCA_2Yr.length}`);
console.log("======================================");