
import mongoose from "mongoose";
import MarkingSchema from "./models/markingSchema.js";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Marks from "./models/marksSchema.js";
import Faculty from "./models/facultySchema.js";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

// Mock Data IDs
const FACULTY_ID = new mongoose.Types.ObjectId();
const STUDENT_ID = new mongoose.Types.ObjectId();
const PROJECT_ID = new mongoose.Types.ObjectId();
const SCHEMA_ID = new mongoose.Types.ObjectId();

const PROGRAM = "M.Tech Integrated (5 Yrs.)";
const SCHOOL = "SCOPE";
const ACADEMIC_YEAR = "2024-2025";

async function reproduce() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");


        // 1. Cleanup old mock data
        await MarkingSchema.deleteMany({ program: PROGRAM });
        await Student.deleteMany({ emailId: "mock.student@vit.ac.in" }); // Delete by email
        await Project.deleteMany({ name: "Mock M.Tech Project" }); // Delete by name
        // Also cleanup marks for the student if we can find them, but we don't have the student ID if we just deleted it.
        // Actually, let's look up the student first to get ID, then delete marks.
        const existingStudent = await Student.findOne({ emailId: "mock.student@vit.ac.in" });
        if (existingStudent) {
            await Marks.deleteMany({ student: existingStudent._id });
        }

        await Faculty.deleteMany({ emailId: "mock.faculty@vit.ac.in" }); // Delete by email



        // 2. Create Faculty
        const faculty = await Faculty.create({
            _id: FACULTY_ID,
            name: "Mock Faculty",
            emailId: "mock.faculty@vit.ac.in", // Fixed: emailId
            employeeId: "MOCK001",
            school: SCHOOL,
            role: "faculty",
            isActive: true,
            phoneNumber: "1234567890", // Added required field
            password: "hashedpassword", // Added required field
            program: [PROGRAM] // Fixed: array
        });
        console.log("Created Faculty:", faculty._id);

        // 3. Create Marking Schema
        const schema = await MarkingSchema.create({
            _id: SCHEMA_ID,
            school: SCHOOL,
            program: PROGRAM,
            academicYear: ACADEMIC_YEAR,
            reviews: [
                {
                    reviewName: "review_1",
                    displayName: "Review 1",
                    facultyType: "guide",
                    order: 1,
                    deadline: { from: new Date(), to: new Date(Date.now() + 86400000) }, // Future
                    isActive: true,
                    components: [
                        {
                            componentId: new mongoose.Types.ObjectId(),
                            name: "Component A",
                            maxMarks: 50,
                            subComponents: []
                        }
                    ]
                }
            ]
        });
        console.log("Created Marking Schema");

        // 4. Create Student
        const student = await Student.create({
            _id: STUDENT_ID,
            name: "Mock Student",
            regNo: "21MIM1001",
            emailId: "mock.student@vit.ac.in", // Fixed: emailId
            school: SCHOOL,
            program: PROGRAM,
            academicYear: ACADEMIC_YEAR,
            phoneNumber: "9876543210"
        });
        console.log("Created Student");




        // 5. Create Project
        const project = await Project.create({
            _id: PROJECT_ID,
            name: "Mock M.Tech Project",
            students: [STUDENT_ID],
            guideFaculty: FACULTY_ID,
            academicYear: ACADEMIC_YEAR,
            school: SCHOOL,
            program: PROGRAM,
            status: "active", // Fixed: active
            type: "software", // Added required field
            specialization: "Integrated Software Engineering", // Added required field
            teamSize: 1 // Added required field
        });
        console.log("Created Project");



        // 6. Submit Marks (Simulate Backend)
        // Note: The user said "backend returning Marks already submitted error"
        // This implies they tried to submit.
        // Let's first submit marks.

        const reviewType = "review_1"; // Schema says "review_1"



        const markEntry = await Marks.create({
            student: STUDENT_ID,
            project: PROJECT_ID,
            faculty: FACULTY_ID,
            reviewType: reviewType,
            facultyType: "guide",
            academicYear: ACADEMIC_YEAR, // Added required field
            school: SCHOOL,              // Added required field
            program: PROGRAM,            // Added required field
            componentMarks: [
                {
                    componentId: schema.reviews[0].components[0].componentId,
                    componentName: schema.reviews[0].components[0].name,
                    marks: 40,
                    maxMarks: 50,
                    componentTotal: 40,
                    componentMaxTotal: 50
                }
            ],
            totalMarks: 40,
            maxTotalMarks: 50,
            isSubmitted: true
        });
        console.log("Submitted Marks:", markEntry._id);



        // 7. Now simulate fetching reviews (similar to useFacultyReviews hook logic / FacultyController)
        // We need to see if these marks are returned and correctly mapped.

        // Fetch Projects for Faculty
        const projects = await Project.find({ guideFaculty: FACULTY_ID }).lean();
        const p = projects.find(p => p._id.toString() === PROJECT_ID.toString());
        console.log("Fetched Project:", p.name);

        // Fetch Marks for Faculty
        const marks = await Marks.find({
            project: PROJECT_ID,
            // In simple terms, the controller might fetch by faculty
            faculty: FACULTY_ID
        }).lean();
        console.log("Fetched Marks Count:", marks.length);
        console.log("Fetched Marks ReviewType:", marks[0]?.reviewType);

        // Simulate Frontend Matching
        const reviewIdFromSchema = schema.reviews[0].reviewName; // "review_1"
        const markReviewType = marks[0]?.reviewType; // "review_1"

        console.log(`Schema Review ID: '${reviewIdFromSchema}'`);
        console.log(`Mark Review Type: '${markReviewType}'`);

        if (reviewIdFromSchema === markReviewType) {
            console.log("SUCCESS: IDs match. Frontend should see it.");
        } else {
            console.log("FAILURE: IDs Do Not Match.");
        }

        // Now what if the Schema had a DIFFERENT ID?
        // Like "review_1_3745" dynamic ID?

    } catch (error) {
        console.error("Error:", error);
    } finally {
        // Cleanup? Maybe keep it for inspection.
        await mongoose.disconnect();
    }
}

reproduce();
