import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const rawData = `20MIA1102	52285 Dr. Sandosh S & 54527 Dr. Rajkumar R
20MIA1173	
21MIA1006	
21MIA1008	
21MIA1009	
21MIA1014	
21MIA1018	52799 Dr. Benil T & 51662 Dr. X Anita
21MIA1025	
21MIA1027	
21MIA1028	
21MIA1029	
21MIA1030	
21MIA1033	53164 Dr. Ahadit A B & 54146 Dr. Poornima S
21MIA1037	
21MIA1039	
21MIA1042	
21MIA1043	
21MIA1044	
21MIA1050	54510 Dr. Sindhu Ravindran & 53626 Dr. Jai Vinita L
21MIA1055	
21MIA1056	
21MIA1060	
21MIA1061	
21MIA1064	
21MIA1068	54183 Dr. Sankari M & 52245 Dr. Sahaya Beni Prathiba B
21MIA1072	
21MIA1073	
21MIA1074	
21MIA1075	
21MIA1077	
21MIA1078	54151 Dr. Aarthi B & 53696 Dr. Madura Meenakshi R
21MIA1079	
21MIA1080	
21MIA1081	
21MIA1083	
21MIA1086	
21MIA1089	54508 Dr. Suhail K & 53877 Dr. Umesh K
21MIA1090	
21MIA1093	
21MIA1094	
21MIA1097	
21MIA1098	
21MIA1100	51347 Dr. Bhuvaneswari A & 54147 Dr. Vigneshwari S
21MIA1101	
21MIA1104	
21MIA1106	
21MIA1108	
21MIA1111	
21MIA1112	51663 Dr. P Subbulakshmi & 52859 Dr. Sobitha Ahila S
21MIA1116	
21MIA1117	
21MIA1120	
21MIA1121	
21MIA1126	
21MIA1129	52833 Dr. Ilavendhan A & 53900 Dr. Sivaranjani N 
21MIA1130	
21MIA1131	
21MIA1132	
21MIA1133	
21MIA1134	
21MIA1135	53695 Dr. Gayathri Devi S & 52264 Dr. Krithiga R
21MIA1136	
21MIA1137	
21MIA1138	
21MIA1144	
21MIA1145	
21MIA1147	
21MIA1150	52288 Dr. Renjith P N & 52281 Dr. Sivakumar P
21MIA1156	
21MIA1160	
21MIA1162	
21MIA1163	
21MIA1164	
21MIA1165`;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const processedAssignments = [];
let currentPanelFacultyIDs = [];

const parseAndAssign = async () => {
    const lines = rawData.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        let regNoMatch = line.match(/(\d{2}[A-Z]{3}\d{4})/);
        if (!regNoMatch) {
            regNoMatch = line.match(/(\d{2}[A-Z]{3}\d{4})/);
        }

        if (!regNoMatch) continue;
        const regNo = regNoMatch[1];

        // Parse Faculty IDs
        const idMatches = line.match(/(\d{5})/g);
        let facultyIDs = [];

        if (idMatches && idMatches.length > 0) {
            facultyIDs = idMatches;
            currentPanelFacultyIDs = facultyIDs;
        } else {
            // Use last seen
            facultyIDs = currentPanelFacultyIDs;
        }

        if (facultyIDs.length === 0) {
            console.warn(`⚠️  No panel context for student ${regNo} (Skipping)`);
            continue;
        }

        processedAssignments.push({
            regNo,
            facultyIDs
        });
    }

    console.log(`Parsed ${processedAssignments.length} assignments.`);
};

const executeAssignments = async () => {
    await connectDB();
    await parseAndAssign();

    let successCount = 0;
    let failureCount = 0;

    // Cache for Panels to avoid repeated DB Lookups
    const panelCache = {}; // key: "id1_id2", value: panelDoc

    for (const assignment of processedAssignments) {
        const { regNo, facultyIDs } = assignment;

        // 1. Find Student
        const student = await Student.findOne({ regNo });
        if (!student) {
            console.error(`❌ Student NOT FOUND: ${regNo}`);
            failureCount++;
            continue;
        }

        // 2. Find Project for this Student
        const project = await Project.findOne({ students: student._id });
        if (!project) {
            console.error(`❌ Project NOT FOUND for student: ${regNo}`);
            failureCount++;
            continue;
        }

        // 3. Find Panel
        const cacheKey = facultyIDs.sort().join('_');
        let panel = panelCache[cacheKey];

        if (!panel) {
            // Resolve Faculty IDs to ObjectIds
            const faculties = await Faculty.find({ employeeId: { $in: facultyIDs } });
            if (faculties.length !== facultyIDs.length) {
                console.error(`❌ Could not find all faculty members for IDs: [${facultyIDs.join(', ')}]`);
                failureCount++;
                continue;
            }
            const facultyIds = faculties.map(f => f._id);

            // Find panel that has exactly these members
            panel = await Panel.findOne({
                "members.faculty": { $all: facultyIds },
                $expr: { $eq: [{ $size: "$members" }, facultyIds.length] }
            });

            if (panel) {
                panelCache[cacheKey] = panel;
            }
        }

        if (!panel) {
            console.error(`❌ Panel NOT FOUND for faculty IDs: [${facultyIDs.join(', ')}] (Project: "${project.name}")`);
            failureCount++;
            continue;
        }

        // 4. Assign
        if (project.panel && project.panel.toString() === panel._id.toString()) {
            successCount++;
        } else {
            project.panel = panel._id;
            await project.save();
            console.log(`✅ Assigned "${project.name}" (${regNo}) to Panel ${panel.panelName}`);
            successCount++;
        }
    }

    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Total Processed: ${processedAssignments.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failureCount}`);

    process.exit(0);
};

executeAssignments();
