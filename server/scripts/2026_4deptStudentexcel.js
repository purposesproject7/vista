import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "Students_Template_Filled.xlsx");

const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const students = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const categories = {
  BTech: ["BAI", "BCE", "BDS", "BPS", "BRS"],
  MTech_5Yr_Integrated: ["MIA", "MIS"],
  MTech_2Yr: ["MML", "MCS", "MCB", "MAS", "MAI"],
  MCA_2Yr: ["MCA"],
};

const result = {
  BTech: [],
  MTech_5Yr_Integrated: [],
  MTech_2Yr: [],
  MCA_2Yr: [],
};

for (const student of students) {
  const regNo = String(student.regNo ?? "").toUpperCase();

  if (categories.BTech.some(code => regNo.includes(code))) {
    result.BTech.push(student);
  } else if (
    categories.MTech_5Yr_Integrated.some(code => regNo.includes(code))
  ) {
    result.MTech_5Yr_Integrated.push(student);
  } else if (
    categories.MTech_2Yr.some(code => regNo.includes(code))
  ) {
    result.MTech_2Yr.push(student);
  } else if (
    categories.MCA_2Yr.some(code => regNo.includes(code))
  ) {
    result.MCA_2Yr.push(student);
  }
}

function saveExcel(fileName, data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, path.join(__dirname, fileName));
}

saveExcel("BTech.xlsx", result.BTech);
saveExcel("MTech_5Yr_Integrated.xlsx", result.MTech_5Yr_Integrated);
saveExcel("MTech_2Yr.xlsx", result.MTech_2Yr);
saveExcel("MCA_2Yr.xlsx", result.MCA_2Yr);

console.log("✅ Files Generated");
console.log("BTech:", result.BTech.length);
console.log("MTech 5 Yr Integrated:", result.MTech_5Yr_Integrated.length);
console.log("MTech 2 Yr:", result.MTech_2Yr.length);
console.log("MCA 2 Yr:", result.MCA_2Yr.length);