
import { ActivityLogService } from "./services/activityLogService.js";

console.log("Type of ActivityLogService:", typeof ActivityLogService);
console.log("ActivityLogService keys:", Object.keys(ActivityLogService || {}));
console.log("Is logActivity a function?", typeof ActivityLogService?.logActivity === 'function');

if (typeof ActivityLogService.logActivity !== 'function') {
    console.error("FATAL: logActivity is NOT a function!");
} else {
    console.log("Import seems OK.");
}
