
import ActivityLogService from "./services/activityLogService.js";
import fs from "fs";

const output = [];
output.push(`Type of ActivityLogService: ${typeof ActivityLogService}`);

try {
    if (ActivityLogService) {
        output.push(`Keys: ${Object.keys(ActivityLogService).join(", ")}`);
        output.push(`Prop names: ${Object.getOwnPropertyNames(ActivityLogService).join(", ")}`);
        output.push(`Is logActivity a function? ${typeof ActivityLogService.logActivity === 'function'}`);
    } else {
        output.push("ActivityLogService is falsy");
    }
} catch (e) {
    output.push(`Error inspecting: ${e.message}`);
}

fs.writeFileSync("debug_import_result.txt", output.join("\n"));
console.log("Done writing to debug_import_result.txt");
