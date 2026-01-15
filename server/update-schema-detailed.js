import mongoose from "mongoose";
import dotenv from "dotenv";
import MarkingSchema from "./models/markingSchema.js"; // Assuming this is the model file

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const schemaId = "6960980cbbe3e7cb313e79a2"; // From user snippet

        // Detailed data to inject
        const detailedComponents = [
            {
                // Literature Survey
                _id: "696096aebbe3e7cb313e7994", // Preserve ID if possible or let Mongo gen new ones if recreating
                componentId: "696096aebbe3e7cb313e7994",
                name: "Literature Survey",
                maxMarks: 5,
                description: "Comprehensive analysis of at least 15-20 recent research papers (last 5 years). The survey must identify the state-of-the-art, highlight existing gaps, and clearly justify the need for the proposed solution. Plagiarism must be below 10%.",
                subComponents: [
                    { name: "Depth of Research", weight: 2, description: "Quality and relevance of cited papers." },
                    { name: "Gap Analysis", weight: 2, description: "Clarity in identifying limitations of existing systems." },
                    { name: "Formatting", weight: 1, description: "Adherence to IEEE citation standards." }
                ]
            },
            {
                // Methodology
                _id: "696096aebbe3e7cb313e7995",
                componentId: "696096aebbe3e7cb313e7995",
                name: "Methodology",
                maxMarks: 5,
                description: "Detailed presentation of the proposed system architecture, algorithms, and data flow. This section should include high-level diagrams, flowchart of the proposed algorithm, and justification for the chosen technology stack.",
                subComponents: []
            }
        ];

        // Fetch and Update
        // Note: We need to match the structure expected by the Schema Model
        const result = await MarkingSchema.updateOne(
            { _id: schemaId },
            {
                $set: {
                    "reviews.0.components": detailedComponents
                }
            }
        );

        console.log("Update Result:", result);

        if (result.modifiedCount > 0) {
            console.log("Successfully updated Marking Schema with detailed descriptions.");
        } else {
            console.log("No document modified. Check if ID exists.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
