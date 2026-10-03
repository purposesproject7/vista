import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Import Models
import MasterData from "../models/masterDataSchema.js";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import MarkingSchemaModel from "../models/markingSchema.js";

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected for seeding...");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // DISTINCT CONTEXT to avoid mixing with previous test
        const CONTEXT = {
            school: "PanelTest School",
            program: "PanelTest Program",
            academicYear: "2024-2025"
        };

        console.log("Cleaning specific test data for Panel Test...");
        // Clean previous test users to reuse emails
        await Faculty.deleteMany({ emailId: { $in: ["guide_ppt@test.com", "panel_ppt@test.com"] } });
        await Student.deleteMany({ emailId: { $in: ["student_panel@test.com"] } });
        await Project.deleteMany({ name: "Panel Only Project" });
        await Panel.deleteMany({ panelName: "Panel Test Panel" });
        await MarkingSchemaModel.deleteMany({ school: CONTEXT.school });

        // 1. Ensure Master Data Exists
        console.log("Updating Master Data...");
        let master = await MasterData.findOne();
        if (!master) {
            master = new MasterData({ schools: [], programs: [], academicYears: [] });
        }

        if (!master.schools.some(s => s.name === CONTEXT.school)) {
            master.schools.push({ name: CONTEXT.school, code: "PNL", isActive: true });
        }
        if (!master.programs.some(p => p.name === CONTEXT.program)) {
            master.programs.push({ school: CONTEXT.school, name: CONTEXT.program, code: "PNL-PROG", isActive: true });
        }
        if (!master.academicYears.some(y => y.year === CONTEXT.academicYear)) {
            master.academicYears.push({ year: CONTEXT.academicYear, isActive: true });
        }
        await master.save();

        // 2. Component Library (Mock)
        let componentId = new mongoose.Types.ObjectId();

        // 3. Create Marking Schema with TWO Reviews
        console.log("Creating Marking Schema...");
        await MarkingSchemaModel.create({
            ...CONTEXT,
            reviews: [
                {
                    reviewName: "Review 1",
                    displayName: "Review 1 - Guide Only",
                    facultyType: "guide", // GUIDE ONLY - Should NOT show PPT Approval
                    order: 1,
                    deadline: { from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                    pptRequired: false,
                    components: [{
                        componentId: componentId,
                        name: "Guide Evaluation",
                        maxMarks: 50,
                        subComponents: [{ name: "Progress", weight: 50 }]
                    }]
                },
                {
                    reviewName: "Review 2",
                    displayName: "Review 2 - Panel Check",
                    facultyType: "panel", // PANEL ONLY - SHOULD show PPT Approval
                    order: 2,
                    deadline: { from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                    pptRequired: true, // EXPLICITLY TRUE
                    components: [{
                        componentId: componentId,
                        name: "Panel Evaluation",
                        maxMarks: 50,
                        subComponents: [{ name: "Presentation", weight: 50 }]
                    }]
                }
            ]
        });

        // 4. Create Faculty
        console.log("Creating Faculty...");
        const hashedPassword = await bcrypt.hash("password123", 10);

        const [guide, panelMember] = await Faculty.create([
            {
                name: "Dr. Guide PPT",
                emailId: "guide_ppt@test.com",
                employeeId: "GUIDE_PPT",
                password: hashedPassword,
                role: "faculty",
                phoneNumber: "9876543210",
                ...CONTEXT
            },
            {
                name: "Dr. Panel PPT",
                emailId: "panel_ppt@test.com",
                employeeId: "PANEL_PPT",
                password: hashedPassword,
                role: "faculty",
                phoneNumber: "9876543211",
                ...CONTEXT
            }
        ]);

        // 5. Create Panel Group
        console.log("Creating Panel Group...");
        const panel = await Panel.create({
            panelName: "Panel Test Panel",
            facultyEmployeeIds: [panelMember.employeeId],
            members: [{ faculty: panelMember._id, facultyEmployeeId: panelMember.employeeId }],
            specializations: ["All"],
            isActive: true,
            ...CONTEXT
        });

        // 6. Create Student
        console.log("Creating Student...");
        const student = await Student.create({
            regNo: "PNL001",
            name: "Panel Student",
            emailId: "student_panel@test.com",
            password: hashedPassword,
            ...CONTEXT
        });

        // 7. Create Project
        console.log("Creating Project...");
        await Project.create({
            name: "Panel Only Project",
            students: [student._id],
            guideFaculty: guide._id,
            panel: panel._id,
            // Assign Panel to Review 2 specifically (Review 1 is guide only)
            reviewPanels: [
                { reviewType: "Review 2", panel: panel._id }
            ],
            specialization: "All",
            type: "software",
            status: "active",
            teamSize: 1,
            pptApprovals: [],
            ...CONTEXT
        });

        console.log("\n✅ Panel Review Test Data Created!");
        console.log("------------------------------------------------");
        console.log("GUIDE Login:  guide_ppt@test.com  / password123");
        console.log("PANEL Login:  panel_ppt@test.com  / password123");
        console.log("------------------------------------------------");

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
