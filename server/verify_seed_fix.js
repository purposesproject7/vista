import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "./models/projectSchema.js";
import MasterData from "./models/masterDataSchema.js";

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Custom Verification Connected");

        const project = await Project.findOne({ name: "AI Based Traffic System" });
        if (!project) {
            console.error("❌ Project not found!");
            return;
        }

        console.log(`\nProject Found: ${project.name}`);
        console.log(`School: ${project.school}`);
        console.log(`Program: ${project.program}`);
        console.log(`Year: ${project.academicYear}`);

        const master = await MasterData.findOne({});
        const schoolExists = master.schools.some(s => s.code === "SCOPE" && s.name === "School of Computer Science and Engineering");
        const programExists = master.programs.some(p => p.code === "BTECH" && p.school === "SCOPE");
        const yearExists = master.academicYears.some(y => y.year === project.academicYear);

        console.log(`\nMasterData Checks:`);
        console.log(`School (SCOPE) Exists? ${schoolExists ? "✅" : "❌"}`);
        console.log(`Program (BTECH) Exists? ${programExists ? "✅" : "❌"}`);
        console.log(`Year Exists? ${yearExists ? "✅" : "❌"}`);

        console.log(`\nProject Data Check:`);
        console.log(`Project School is SCOPE? ${project.school === "SCOPE" ? "✅" : "❌ (" + project.school + ")"}`);
        console.log(`Project Program is BTECH? ${project.program === "BTECH" ? "✅" : "❌ (" + project.program + ")"}`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

verify();
