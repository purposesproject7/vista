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
// MIA
// const rawData = `20MIA1102	52285 Dr. Sandosh S & 54527 Dr. Rajkumar R
// 20MIA1173	
// 21MIA1006	
// 21MIA1008	
// 21MIA1009	
// 21MIA1014	
// 21MIA1018	52799 Dr. Benil T & 51662 Dr. X Anita
// 21MIA1025	
// 21MIA1027	
// 21MIA1028	
// 21MIA1029	
// 21MIA1030	
// 21MIA1033	53164 Dr. Ahadit A B & 54146 Dr. Poornima S
// 21MIA1037	
// 21MIA1039	
// 21MIA1042	
// 21MIA1043	
// 21MIA1044	
// 21MIA1050	54510 Dr. Sindhu Ravindran & 53626 Dr. Jai Vinita L
// 21MIA1055	
// 21MIA1056	
// 21MIA1060	
// 21MIA1061	
// 21MIA1064	
// 21MIA1068	54183 Dr. Sankari M & 52245 Dr. Sahaya Beni Prathiba B
// 21MIA1072	
// 21MIA1073	
// 21MIA1074	
// 21MIA1075	
// 21MIA1077	
// 21MIA1078	54151 Dr. Aarthi B & 53696 Dr. Madura Meenakshi R
// 21MIA1079	
// 21MIA1080	
// 21MIA1081	
// 21MIA1083	
// 21MIA1086	
// 21MIA1089	54508 Dr. Suhail K & 53877 Dr. Umesh K
// 21MIA1090	
// 21MIA1093	
// 21MIA1094	
// 21MIA1097	
// 21MIA1098	
// 21MIA1100	51347 Dr. Bhuvaneswari A & 54147 Dr. Vigneshwari S
// 21MIA1101	
// 21MIA1104	
// 21MIA1106	
// 21MIA1108	
// 21MIA1111	
// 21MIA1112	51663 Dr. P Subbulakshmi & 52859 Dr. Sobitha Ahila S
// 21MIA1116	
// 21MIA1117	
// 21MIA1120	
// 21MIA1121	
// 21MIA1126	
// 21MIA1129	52833 Dr. Ilavendhan A & 53900 Dr. Sivaranjani N 
// 21MIA1130	
// 21MIA1131	
// 21MIA1132	
// 21MIA1133	
// 21MIA1134	
// 21MIA1135	53695 Dr. Gayathri Devi S & 52264 Dr. Krithiga R
// 21MIA1136	
// 21MIA1137	
// 21MIA1138	
// 21MIA1144	
// 21MIA1145	
// 21MIA1147	
// 21MIA1150	52288 Dr. Renjith P N & 52281 Dr. Sivakumar P
// 21MIA1156	
// 21MIA1160	
// 21MIA1162	
// 21MIA1163	
// 21MIA1164	
// 21MIA1165`;

// MIS
const rawData = `17MIS1087	51669 Dr. A Swaminathan & 53391 Dr. Selvam D
19MIS1146	
19MIS1188	
21MIS1005	
21MIS1007	
21MIS1008	
21MIS1010	52312 Dr. Kiruthika S & 52322 Dr. Modigari Narendra
21MIS1011	
21MIS1012	
21MIS1013	
21MIS1016	
21MIS1017	
21MIS1018	51946 Dr. T Kalaipriyan & 51947 Dr. Rajakumar Arul
21MIS1019	
21MIS1020	
21MIS1022	
21MIS1023	
21MIS1026	
21MIS1029	51949 Dr. Suganeshwari G & 53694 Prof. Prethija G
21MIS1030	
21MIS1032	
21MIS1033	
21MIS1034	
21MIS1035	
21MIS1036	53136 Dr. Sridevi S & 53388 Dr. Kavipriya G
21MIS1038	
21MIS1039	
21MIS1040	
21MIS1041	
21MIS1043	
21MIS1045	53618 Dr. Sakthivel R & 53633 Dr. Ranjith Kumar M
21MIS1047	
21MIS1048	
21MIS1050	
21MIS1051	
21MIS1052	
21MIS1053	53624 Dr. Hemalatha K & 53617 Dr. Devi K
21MIS1056	
21MIS1058	
21MIS1060	
21MIS1061	
21MIS1062	
21MIS1063	53078 Dr. V. Premanand & 53102 Dr. Nathezhtha T
21MIS1066	
21MIS1067	
21MIS1069	
21MIS1070	
21MIS1075	
21MIS1076	53075 Dr. Kaja Mohideen A & 53615 Dr. Balraj E
21MIS1077	
21MIS1078	
21MIS1079	
21MIS1080	
21MIS1085	
21MIS1086	53049 Dr. Revathi A R &53568 Dr. Softya Sebastian
21MIS1087	
21MIS1088	
21MIS1091	
21MIS1094	
21MIS1097	
21MIS1100	52361 Dr. Raja Sree T & 53545 Dr. Sharmila Devi S
21MIS1102	
21MIS1103	
21MIS1105	
21MIS1106	
21MIS1109	
21MIS1110	52273 Dr. S A Amutha Jeevakumari &53387 Dr. Anita Christaline J
21MIS1112	
21MIS1113	
21MIS1116	
21MIS1117	
21MIS1119	
21MIS1122	53376 Dr. Nivethitha V & 53398 Dr. Santhi V
21MIS1123	
21MIS1124	
21MIS1125	
21MIS1126	
21MIS1127	
21MIS1128	52304 Dr. Sureshkumar WI & 52309 Dr. Smrithy G S
21MIS1131	
21MIS1134	
21MIS1135	
21MIS1137	
21MIS1138	
21MIS1139	53368 Dr. Logeswari G & 53139 Dr. Indira B
21MIS1141	
21MIS1145	
21MIS1151	
21MIS1153	
21MIS1156	
21MIS1157	53343 Dr. Lekshmi K & 53159 Dr. Renuka Devi R
21MIS1160	
21MIS1164	
21MIS1167	
21MIS1173	
21MIS1176	
21MIS1178	53104 Dr. Raja M & 53105 Dr. Balasaraswathi V R
21MIS1180	
21MIS1181	
21MIS1183	
21MIS1184	
21MIS1186	
21MIS1189	51328 Dr. V. Muthumanikandan & 53166 Dr. Marimuthu
21MIS1190	
21MIS1191	
21MIS1192	
21MIS1193	
21MIS1196	
21MIS1197`

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
