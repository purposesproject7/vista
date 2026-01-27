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
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected for seeding...");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        const CONTEXT = {
            school: "PPT Test School",
            program: "PPT Test Program",
            academicYear: "2024-2025"
        };

        console.log("Cleaning specific test data...");
        await Faculty.deleteMany({ emailId: { $in: ["guide_ppt@test.com", "panel_ppt@test.com"] } });
        await Student.deleteMany({ emailId: { $in: ["student_ppt@test.com"] } });
        await Project.deleteMany({ name: "PPT Verification Project" });
        await Panel.deleteMany({ panelName: "PPT Test Panel" });
        await MarkingSchemaModel.deleteMany({ school: CONTEXT.school });
        // Clean Master Data references if they exist, or just append distinct

        // 1. Ensure Master Data Exists
        console.log("Updating Master Data...");
        let master = await MasterData.findOne();
        if (!master) {
            master = new MasterData({ schools: [], programs: [], academicYears: [] });
        }

        if (!master.schools.some(s => s.name === CONTEXT.school)) {
            master.schools.push({ name: CONTEXT.school, code: "PPT", isActive: true });
        }
        if (!master.programs.some(p => p.name === CONTEXT.program)) {
            master.programs.push({ school: CONTEXT.school, name: CONTEXT.program, code: "PPT-PROG", isActive: true });
        }
        if (!master.academicYears.some(y => y.year === CONTEXT.academicYear)) {
            master.academicYears.push({ year: CONTEXT.academicYear, isActive: true });
        }
        await master.save();

        // 2. Create Component Library (Minimal)
        // Reuse existing or create simple one if needed. 
        // We'll trust existing components or just not link them tightly for this test if possible.
        // But MarkingSchema needs component IDs. Let's fetch ANY existing component or create one.
        let component = await ComponentLibrary.findOne({ "components.name": "Presentation" });
        let componentId;

        if (!component) {
            console.log("Creating Temp Component Library...");
            const lib = new ComponentLibrary({
                ...CONTEXT,
                components: [{
                    name: "Presentation",
                    category: "General",
                    description: "PPT",
                    maxMarks: 50,
                    isActive: true,
                    subComponents: [{ name: "Slide Quality", weight: 50, description: "Good slides" }]
                }]
            });
            const savedLib = await lib.save();
            componentId = savedLib.components[0]._id;
        } else {
            componentId = component.components.find(c => c.name === "Presentation")._id;
        }

        // 3. Create Marking Schema
        console.log("Creating Marking Schema...");
        await MarkingSchemaModel.create({
            ...CONTEXT,
            reviews: [{
                reviewName: "Review 1",
                displayName: "Review 1 - PPT Check",
                facultyType: "both",
                order: 1,
                deadline: { from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Active
                pptRequired: true,
                components: [{
                    componentId: componentId,
                    name: "Presentation",
                    maxMarks: 50,
                    subComponents: [{ name: "Slide Quality", weight: 50 }]
                }]
            }]
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
                ...CONTEXT
            },
            {
                name: "Dr. Panel PPT",
                emailId: "panel_ppt@test.com",
                employeeId: "PANEL_PPT",
                password: hashedPassword,
                role: "faculty",
                ...CONTEXT
            }
        ]);

        // 5. Create Panel Group
        console.log("Creating Panel Group...");
        const panel = await Panel.create({
            panelName: "PPT Test Panel",
            facultyEmployeeIds: [panelMember.employeeId],
            members: [{ faculty: panelMember._id, facultyEmployeeId: panelMember.employeeId }],
            specializations: ["All"],
            isActive: true,
            ...CONTEXT
        });

        // 6. Create Student
        console.log("Creating Student...");
        const student = await Student.create({
            regNo: "PPT001",
            name: "Student PPT",
            emailId: "student_ppt@test.com",
            password: hashedPassword,
            ...CONTEXT
        });

        // 7. Create Project
        console.log("Creating Project...");
        await Project.create({
            name: "PPT Verification Project",
            students: [student._id],
            guideFaculty: guide._id,
            panel: panel._id,
            reviewPanels: [{ reviewType: "Review 1", panel: panel._id }], // Ensure review logic picks this up
            specialization: "All",
            type: "software",
            status: "active",
            teamSize: 1,
            pptApprovals: [], // Explicitly empty
            ...CONTEXT
        });

        console.log("\n✅ Seed Data Created Successfully!");
        console.log("------------------------------------------------");
        console.log("GUIDE Login:  guide_ppt@test.com  / password123");
        console.log("PANEL Login:  panel_ppt@test.com  / password123");
        console.log("STUDENT:      student_ppt@test.com");
        console.log("PROJECT:      PPT Verification Project");
        console.log("------------------------------------------------");

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
