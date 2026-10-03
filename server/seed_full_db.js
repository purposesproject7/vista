import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Import Models
import MasterData from "./models/masterDataSchema.js";
import Faculty from "./models/facultySchema.js";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Panel from "./models/panelSchema.js";
import ComponentLibrary from "./models/componentLibrarySchema.js";
import MarkingSchemaModel from "./models/markingSchema.js";
import ProjectCoordinator from "./models/projectCoordinatorSchema.js";
import AccessRequest from "./models/accessRequestSchema.js";

// Setup environment
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log("------------------------------------------------");
console.log("🔥 FULL DATABASE RESET & SEED SCRIPT STARTED 🔥");
console.log("------------------------------------------------");

const connectDB = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is undefined in .env");
        }
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // --- 1. CLEAN DATABASE ---
        console.log("\n🗑️  Cleaning all collections...");
        await Promise.all([
            MasterData.deleteMany({}),
            Faculty.deleteMany({}),
            Student.deleteMany({}),
            Project.deleteMany({}),
            Panel.deleteMany({}),
            ComponentLibrary.deleteMany({}),
            MarkingSchemaModel.deleteMany({}),
            ProjectCoordinator.deleteMany({}),
            AccessRequest.deleteMany({})
        ]);
        console.log("✅ Database cleared.");

        // --- 2. MASTER DATA ---
        console.log("\n📅 Creating Master Data...");
        // CONSTANTS - ALIGNED WITH FRONTEND (FilterPanel.jsx uses SCOPE, SENSE, SELECT)
        const schoolName = "School of Computer Science and Engineering";
        const schoolCode = "SCOPE"; // CRITICAL: Frontend filters use this code

        const programName = "B.Tech Computer Science";
        const programCode = "BTECH"; // CRITICAL: Frontend filters use this code

        const academicYear = "2024-2025";

        const masterData = new MasterData({
            schools: [{ name: schoolName, code: schoolCode, isActive: true }],
            programs: [{ school: schoolCode, name: programName, code: programCode, isActive: true }],
            academicYears: [{ year: academicYear, isActive: true }]
        });
        await masterData.save();
        console.log("✅ Master Data created.");

        // --- 3. COMPONENT LIBRARY ---
        console.log("\n📚 Creating Component Library...");
        const compLib = new ComponentLibrary({
            school: schoolCode,
            program: programCode,
            academicYear: academicYear,
            components: [
                {
                    name: "Presentation",
                    category: "Presentation",
                    description: "Standard PPT assessment",
                    maxMarks: 50,
                    isActive: true,
                    predefinedSubComponents: [
                        { name: "Content", weight: 20, description: "Quality of content" },
                        { name: "Communication", weight: 20, description: "Flow and clarity" },
                        { name: "Q&A", weight: 10, description: "Handling questions" }
                    ]
                },
                {
                    name: "Report",
                    category: "Documentation",
                    description: "Standard Report assessment",
                    maxMarks: 100,
                    isActive: true,
                    predefinedSubComponents: [
                        { name: "Formatting", weight: 30, description: "Adherence to format" },
                        { name: "Technical Depth", weight: 70, description: "Depth of research" }
                    ]
                }
            ]
        });
        const savedCompLib = await compLib.save();
        const pptComponentId = savedCompLib.components[0]._id; // Get the ID for linking
        console.log("✅ Component Library created.");

        // --- 4. MARKING SCHEMA (Reviews) ---
        console.log("\n📝 Creating Marking Schema (Reviews)...");

        // Dates
        const today = new Date();
        const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(today.getMonth() - 1);
        const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);
        const oneMonthFuture = new Date(today); oneMonthFuture.setMonth(today.getMonth() + 1);

        const markingSchema = new MarkingSchemaModel({
            school: schoolCode,
            program: programCode,
            academicYear: academicYear,
            reviews: [
                {
                    reviewName: "review1",
                    displayName: "Review 1 - Project Proposal (Expired)",
                    facultyType: "both", // Guide + Panel
                    order: 1,
                    deadline: { from: oneMonthAgo, to: twoWeeksAgo }, // EXPIRED
                    pptRequired: true,
                    draftRequired: true,
                    isActive: true, // It was active, just deadline passed
                    components: [{
                        componentId: pptComponentId,
                        name: "Presentation",
                        maxMarks: 50,
                        subComponents: [
                            { name: "Content", weight: 20 },
                            { name: "Communication", weight: 20 },
                            { name: "Q&A", weight: 10 }
                        ]
                    }]
                },
                {
                    reviewName: "review2",
                    displayName: "Review 2 - Progress Check (Active)",
                    facultyType: "panel",
                    order: 2,
                    deadline: { from: today, to: oneMonthFuture }, // ACTIVE
                    pptRequired: true,
                    draftRequired: false,
                    isActive: true,
                    components: [{
                        componentId: pptComponentId,
                        name: "Presentation",
                        maxMarks: 50,
                        subComponents: [
                            { name: "Content", weight: 20 },
                            { name: "Communication", weight: 20 },
                            { name: "Q&A", weight: 10 }
                        ]
                    }]
                }
            ],
            requiresContribution: true,
            contributionTypes: ["Journal Publication"],
            totalWeightage: 100
        });
        await markingSchema.save();
        console.log("✅ Marking Schema created (1 Expired, 1 Active Review).");

        // --- 5. USERS (Faculty/Student) ---
        console.log("\n👥 Creating Users...");
        const password = await bcrypt.hash("password123", 10);

        // A. Admin (Using Faculty schema with role='admin')
        await Faculty.create({
            name: "System Admin",
            emailId: "admin@vista.com",
            employeeId: "ADMIN001",
            password: password,
            role: "admin",
            phoneNumber: "0000000000",
            school: schoolCode,
            program: [programCode],
            specialization: "All"
        });

        // B. Guide
        const guide = await Faculty.create({
            name: "Dr. Guide",
            emailId: "guide@vista.com",
            employeeId: "GUIDE001",
            password: password,
            role: "faculty",
            phoneNumber: "1111111111",
            school: schoolCode,
            program: [programCode],
            specialization: "AI"
        });

        // C. Panel Member
        const panelMember = await Faculty.create({
            name: "Prof. Panel",
            emailId: "panel@vista.com",
            employeeId: "PANEL001",
            password: password,
            role: "faculty",
            phoneNumber: "2222222222",
            school: schoolCode,
            program: [programCode],
            specialization: "AI"
        });

        // D. Project Coordinator
        // First create faculty entry
        const coordinatorFaculty = await Faculty.create({
            name: "Mr. Coordinator",
            emailId: "coord@vista.com",
            employeeId: "COORD001",
            password: password,
            role: "faculty",
            phoneNumber: "3333333333",
            school: schoolCode,
            program: [programCode],
            specialization: "Networks",
            isProjectCoordinator: true
        });

        // Then create ProjectCoordinator entry
        await ProjectCoordinator.create({
            faculty: coordinatorFaculty._id,
            school: schoolCode,
            program: programCode,
            academicYear: academicYear,
            isPrimary: true
        });

        // E. Student
        const student = await Student.create({
            name: "John Student",
            emailId: "student@vista.com",
            regNo: "STU001",
            password: password,
            school: schoolCode,
            program: programCode,
            academicYear: academicYear
        });

        console.log("✅ Users created: Admin, Guide, Panel, Coordinator, Student.");

        // --- 6. RELATIONSHIPS (Panel Group & Project) ---
        console.log("\n🔗 Creating Relationships...");

        // Create Panel Group
        const panelGroup = await Panel.create({
            panelName: "AI Review Panel",
            facultyEmployeeIds: [panelMember.employeeId],
            members: [{ faculty: panelMember._id, facultyEmployeeId: panelMember.employeeId }],
            specializations: ["AI"],
            isActive: true,
            school: schoolCode,
            program: programCode,
            academicYear: academicYear
        });

        // Create Project
        await Project.create({
            name: "AI Based Traffic System",
            students: [student._id],
            guideFaculty: guide._id,
            panel: panelGroup._id,
            reviewPanels: [
                { reviewType: "review1", panel: panelGroup._id },
                { reviewType: "review2", panel: panelGroup._id }
            ],
            specialization: "AI",
            type: "software",
            status: "active",
            teamSize: 1,
            // LINK TO STUDENT'S DETAILS (Should now match SCOPE/BTECH)
            school: student.school,
            program: student.program,
            academicYear: student.academicYear,
            pptApprovals: []
        });

        console.log("✅ Project & Panel created (Project linked to Student's School/Program/Year).");

        // --- 7. SUMMARY ---
        console.log("\n================================================");
        console.log("🎉  SEEDING COMPLETE! (Password for all: password123)");
        console.log("================================================");
        console.log("👤 ADMIN:       admin@vista.com");
        console.log("👤 COORDINATOR: coord@vista.com");
        console.log("👤 GUIDE:       guide@vista.com");
        console.log("👤 PANEL:       panel@vista.com");
        console.log("👤 STUDENT:     student@vista.com");
        console.log("\n⚠️  NOTE: Login as Guide/Panel to check reviews.");
        console.log("================================================");

    } catch (err) {
        console.error("❌ Error seeding data:");
        console.error(err);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
