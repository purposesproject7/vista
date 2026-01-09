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
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for seeding...");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        console.log("Cleaning existing test data...");
        await MasterData.deleteMany({});
        await Faculty.deleteMany({ emailId: { $in: ["faculty1@test.com", "faculty2@test.com", "faculty3@test.com"] } });
        await Student.deleteMany({ emailId: { $in: ["student1@test.com", "student2@test.com", "student3@test.com", "student4@test.com"] } });
        await Project.deleteMany({ name: { $in: ["AI-Based Healthcare System", "Smart City Traffic Management"] } });
        await Panel.deleteMany({ panelName: "Test Panel 1" });
        await ComponentLibrary.deleteMany({ academicYear: "2024-2025" });
        await MarkingSchemaModel.deleteMany({ academicYear: "2024-2025" });

        console.log("Creating Master Data...");
        const masterData = new MasterData({
            schools: [{ name: "School of Computing", code: "SCOPE", isActive: true }],
            programs: [{ school: "School of Computing", name: "B.Tech Computer Science and Engineering", code: "BTECH-CSE", isActive: true }],
            academicYears: [{ year: "2024-2025", isActive: true, isCurrent: true }],
        });
        await masterData.save();

        console.log("Creating Component Library with Subcomponents...");
        const componentLib = new ComponentLibrary({
            academicYear: "2024-2025",
            school: "School of Computing",
            program: "B.Tech Computer Science and Engineering",
            components: [
                {
                    name: "Literature Survey",
                    category: "Research",
                    description: "Review of existing literature",
                    suggestedWeight: 20,
                    isActive: true,
                    subComponents: [
                        { name: "Problem Definition", weight: 10, description: "Clarity of problem statement" },
                        { name: "Existing Solutions", weight: 10, description: "Depth of survey" }
                    ]
                },
                {
                    name: "Implementation",
                    category: "Implementation",
                    description: "Code implementation and results",
                    suggestedWeight: 40,
                    isActive: true,
                    subComponents: [
                        { name: "Code Quality", weight: 20, description: "Modularity and comments" },
                        { name: "Results", weight: 20, description: "Accuracy and performance" }
                    ]
                },
                {
                    name: "Presentation",
                    category: "Presentation",
                    description: "Final presentation quality",
                    suggestedWeight: 40,
                    isActive: true,
                    subComponents: [
                        { name: "Slides", weight: 20, description: "Visual clarity" },
                        { name: "Q&A", weight: 20, description: "Handling questions" }
                    ]
                }
            ]
        });
        const savedLib = await componentLib.save();

        // Map components
        const compMap = {};
        savedLib.components.forEach(c => compMap[c.name] = c._id);

        console.log("Creating Marking Schema...");
        const markingSchema = new MarkingSchemaModel({
            school: "School of Computing",
            program: "B.Tech Computer Science and Engineering",
            academicYear: "2024-2025",
            reviews: [
                {
                    reviewName: "Review 1",
                    displayName: "Review 1 - Project Proposal",
                    facultyType: "both",
                    order: 1,
                    deadline: { from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                    components: [
                        {
                            componentId: compMap["Literature Survey"],
                            name: "Literature Survey",
                            maxMarks: 20,
                            subComponents: [
                                { name: "Problem Definition", weight: 10 },
                                { name: "Existing Solutions", weight: 10 }
                            ]
                        },
                        {
                            componentId: compMap["Implementation"],
                            name: "Implementation",
                            maxMarks: 40,
                            subComponents: [
                                { name: "Code Quality", weight: 20 },
                                { name: "Results", weight: 20 }
                            ]
                        },
                        {
                            componentId: compMap["Presentation"],
                            name: "Presentation",
                            maxMarks: 40,
                            subComponents: [
                                { name: "Slides", weight: 20 },
                                { name: "Q&A", weight: 20 }
                            ]
                        }
                    ]
                }
            ]
        });
        await markingSchema.save();

        console.log("Creating Faculties...");
        const hashedPassword = await bcrypt.hash("password123", 10);
        const faculties = await Faculty.create([
            {
                name: "Dr. Faculty One",
                emailId: "faculty1@test.com",
                employeeId: "1001",
                phoneNumber: "9999999991",
                password: hashedPassword,
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                role: "faculty",
                isProjectCoordinator: true
            },
            {
                name: "Dr. Faculty Two",
                emailId: "faculty2@test.com",
                employeeId: "1002",
                phoneNumber: "9999999992",
                password: hashedPassword,
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                role: "faculty"
            },
            {
                name: "Dr. Faculty Three",
                emailId: "faculty3@test.com",
                employeeId: "1003",
                phoneNumber: "9999999993",
                password: hashedPassword,
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                role: "faculty"
            }
        ]);

        console.log("Creating Students...");
        const students = await Student.create([
            {
                regNo: "21BCE1001",
                name: "Student One",
                emailId: "student1@test.com",
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                academicYear: "2024-2025"
            },
            {
                regNo: "21BCE1002",
                name: "Student Two",
                emailId: "student2@test.com",
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                academicYear: "2024-2025"
            },
            {
                regNo: "21BCE1003",
                name: "Student Three",
                emailId: "student3@test.com",
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                academicYear: "2024-2025"
            },
            {
                regNo: "21BCE1004",
                name: "Student Four",
                emailId: "student4@test.com",
                school: "School of Computing",
                program: "B.Tech Computer Science and Engineering",
                academicYear: "2024-2025"
            }
        ]);

        console.log("Creating Panel...");
        const panel = await Panel.create({
            panelName: "Test Panel 1",
            facultyEmployeeIds: ["1001", "1002", "1003"],
            members: [
                { faculty: faculties[0]._id, facultyEmployeeId: "1001" },
                { faculty: faculties[1]._id, facultyEmployeeId: "1002" },
                { faculty: faculties[2]._id, facultyEmployeeId: "1003" }
            ],
            academicYear: "2024-2025",
            school: "School of Computing",
            program: "B.Tech Computer Science and Engineering",
            specializations: ["All"],
            isActive: true
        });

        console.log("Creating Projects...");
        const project1 = await Project.create({
            name: "AI-Based Healthcare System",
            students: [students[0]._id, students[1]._id],
            guideFaculty: faculties[0]._id,
            panel: panel._id,
            reviewPanels: [{ reviewType: "Review 1", panel: panel._id }],
            academicYear: "2024-2025",
            school: "School of Computing",
            program: "B.Tech Computer Science and Engineering",
            specialization: "All",
            type: "software",
            status: "active",
            teamSize: 2
        });

        const project2 = await Project.create({
            name: "Smart City Traffic Management",
            students: [students[2]._id, students[3]._id],
            guideFaculty: faculties[0]._id,
            panel: panel._id,
            reviewPanels: [{ reviewType: "Review 1", panel: panel._id }],
            academicYear: "2024-2025",
            school: "School of Computing",
            program: "B.Tech Computer Science and Engineering",
            specialization: "All",
            type: "software",
            status: "active",
            teamSize: 2
        });

        console.log("Seed data created successfully!");
        console.log(`Log in with: faculty1@test.com / password123`);

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
