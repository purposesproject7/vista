import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const rawData = `Cancer data prediction 	52285 Dr. Sandosh S & 54527 Dr. Rajkumar R
SEVERITY-BASED CLASSIFICATION AND OUTCOME PREDICTION FOR DIABETIC PATIENT HOSPITAL ADMISSI	
MILD COGNITIVE IMPAIRMENT PREDICTION USING EEG SIGNALS	
Personalized AI Tutor	
TOMATO LEAF DISEASE DETECTION	
AUTOMATED CYBER THREAT DETECTION SYSTEM USING HYBRID DEEP LEARNING MODELS	
crop disease prediction 	52799 Dr. Benil T & 51662 Dr. X Anita
4D GAUSSIAN SPLATTING	
An Explainable ensemble learning approach  for LDR prediction with interpretable clinical summaries	
OBJECT DETECTION FOR BRLIND PEOPLE	
Nas100 Stoxk prediction	
FEDERATED LEARNING 	
DETECTION OF SCHIZOPHRENIA 	53164 Dr. Ahadit A B & 54146 Dr. Poornima S
SMART CLASSIFICATION OF PLASTIC WASTE USING IMAGE RECOGNITION	
DEEP LEARNING BASED	
CBS - DASHBOARD	
TENTATIVE TITLE	
MERN TASK MANAGER	
"ARC-CO: A Topology-Aware, Dynamic GPU Virtualization Scheduler for High-Efficiency LLM	54510 Dr. Sindhu Ravindran & 53626 Dr. Jai Vinita L
Medical Imaging Using Transformers	
ABCD	
MANGO FRUIT DISEASE DETECTION 	
An Integrated Predictive Analytics and Optimization Framework for Complex Decision Systems	
Continuous AI‑driven pentesting with runtime‑behavior validation	
SYNTHETIC TABULAR DATA GENERATION USING DIFFUSION MODELS	54183 Dr. Sankari M & 52245 Dr. Sahaya Beni Prathiba B
LLM-POWERED DATA ANALYST	
SHRIMP DISEASE DETECTION	
AI MEDICAL REPORT SUMMARIZER 	
AI AND PLAGIARISM DETECTION USING FEDERATED LEARNING AND BLOCKCHAIN 	
Responsible and Explainable AI Agents with Consensus-Driven Reasoning	
Temporal Graph analytics for Financial fraud detection 	54151 Dr. Aarthi B & 53696 Dr. Madura Meenakshi R
RADIOMICS SIGNATURE OF NUCHAL TRANSLUCENCY AND NASAL BONE IN FIRST-TRIMESTER ULTRASOUND	
SMART PLANT MONITORING	
PORTABLE SMART ATTENDANCE SYSTEM IT EMPLOYEES CNN AND GNN-BASED FACE RECOGNITIONON RASPBER	
Retention Efficiency of Filtration Grids for Microplastic Morphologies	
Hallucination-Safe Medical LLM for Clinical Advice	
ANALYSIS	54508 Dr. Suhail K & 53877 Dr. Umesh K
SELF-HEALING SOFTWARE NETWORK ARCHITECTURE FOR NEXT-GEN IOT SYSTEMS	
Weather Data Visualization and Insights Dashboard	
ULTRASOUND BREAST CANCER PREDICTION USING DL 	
FORGOTTEN APPLIANCE ALERT SYSTEM	
Activity Recognition in Public Places Using Quantum Neural Networks	
 VISION 	51347 Dr. Bhuvaneswari A & 54147 Dr. Vigneshwari S
FRUIT PICKING ASSITANT	
VEHICLE DETECTION 	
Fraud Detection using Anomaly Detection 	
IOT WITH AI	
Learning Discriminative Face Embedings via Self-Supervised Learning	
POSTURE DETECTION USING PRE TRAINED MODELS	51663 Dr. P Subbulakshmi & 52859 Dr. Sobitha Ahila S
HEALTHGPT: SYMPTOM-TO-DIAGNOSIS CHAT ASSISTANT USING EXPLAINABLE AI	
ML Based Emotion and Stress Analytics Using Wearable Sensors	
AI- BASED REAL TIME SIGN LANGUAGE TRANSLATOR USING COMPUTER VISION	
Autonomous Trash Collector Bot with WasteClassification	
SMART PARKING ANALYTICS: AN IOT AND MACHINE LEARNING-BASED PREDICTIVE SYSTEM FOR URBAN PAR	
CRICKET PITCH CLASSIFIER	52833 Dr. Ilavendhan A & 53900 Dr. Sivaranjani N 
Text Classification Using Advanced NLP Techniques 	
SPIKING NEURAL NETWORK	
Adaptive Code Optimizer: AI-Powered Refactoring Assistant	
IOT BASED PROJECT	
GENERATIVE ARTIFICIAL INTELLIGENCE	
ML ANALYSIS CAPSTONE PROJECT	53695 Dr. Gayathri Devi S & 52264 Dr. Krithiga R
RECOMMENDING RELEVANT ADS TO YOUTUBE USERS WITH AN ATTEND-FUSION TRANSFORMER	
AI and ML	
Behavioral Signals to Business Outcomes: A Predictive Analytics Framework for Employee Engagement 	
Yet to Decide 	
An Enhanced AI—Based Network Intrusion Detection System Using Generative Adversarial Networks (GANs)	
ML	
SECURING RETRIEVAL-AUGMENTED GENERATION (RAG) SYSTEMS IN ENTERPRISE LLM DEPLOYMENTS	52288 Dr. Renjith P N & 52281 Dr. Sivakumar P
HeartGuard	
ML AND DL	
Explainable Conversational NL→SQL with Uncertainty-Aware Semantic Parsing for Reliable Decisions	
AI-Powered Analytics Chatbot for Insight Interpretation and Decision Making	
IoT-Based Intelligent Gas Safety System with Real-Time Analytics and Mobile Notification	
Design and Development of an Open-Source Intelligent Robotic Arm Using Learning-Based Control Framew`;

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
let lastPanelFacultyIDs = [];

const parseAndAssign = async () => {
    const lines = rawData.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        let projectName = line;
        let facultyIDs = [];

        // Check for 5-digit regex pattern to identify faculty IDs
        const idMatches = line.match(/(\d{5})/g);

        if (idMatches && idMatches.length > 0) {
            facultyIDs = idMatches;
            // Project name is everything before the first ID
            const firstIdIndex = line.indexOf(idMatches[0]);
            projectName = line.substring(0, firstIdIndex).trim();
            lastPanelFacultyIDs = facultyIDs;
        } else {
            // No panel info, use the last seen panel
            facultyIDs = lastPanelFacultyIDs;
        }

        if (facultyIDs.length === 0) {
            console.warn(`WARNING: No panel found for project "${projectName}" (skipping)`);
            continue;
        }

        // Clean up project name (remove quotes if any)
        projectName = projectName.replace(/^"|"$/g, '').trim();

        processedAssignments.push({
            projectName,
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

    for (const assignment of processedAssignments) {
        const { projectName, facultyIDs } = assignment;

        console.log(`Processing: "${projectName}" -> Panel: ${facultyIDs.join(', ')}`);

        // 1. Find Project
        // Using regex for flexible matching (case insensitive, trim)
        // Escaping special characters in project name just in case
        const escapedName = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const project = await Project.findOne({
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
        });

        if (!project) {
            console.error(`❌ Project NOT FOUND: "${projectName}"`);
            // Attempt partial match or fuzzy log could act here, but for now strict regex
            failureCount++;
            continue;
        }

        // 2. Find or Create Panel
        // Check if a panel exists with EXACTLY these faculty IDs (order irrelevant usually, but let's sort for consistency if we were storing sorted, but here just query)
        // panelSchema stores facultyEmployeeIds as an array of strings.

        let panel = await Panel.findOne({
            facultyEmployeeIds: { $all: facultyIDs, $size: facultyIDs.length },
            academicYear: project.academicYear,
            // Maybe check school too? project.school
        });

        if (!panel) {
            console.log(`⚠️ Panel not found for [${facultyIDs.join(', ')}]. Creating new one...`);

            // Need to fetch faculty _ids to populate legacy `members` field
            const facultyMembers = await Faculty.find({
                employeeId: { $in: facultyIDs }
            });

            if (facultyMembers.length !== facultyIDs.length) {
                console.error(`❌ Could not find all faculty members for IDs: ${facultyIDs.join(', ')}`);
                failureCount++;
                continue;
            }

            const membersPayload = facultyMembers.map(f => ({
                faculty: f._id,
                facultyEmployeeId: f.employeeId
            }));

            // Create new Panel
            panel = await Panel.create({
                panelName: `Panel ${facultyIDs.join('_')}`,
                facultyEmployeeIds: facultyIDs,
                members: membersPayload,
                academicYear: project.academicYear,
                school: project.school,
                program: project.program,
                specializations: [project.specialization], // Initial specialization
                type: "regular",
                isActive: true
            });
            console.log(`✅ Created Panel: ${panel.panelName}`);
        } else {
            // Update panel specializations if needed?
            if (!panel.specializations.includes(project.specialization)) {
                panel.specializations.push(project.specialization);
                await panel.save();
            }
        }

        // 3. Assign Panel to Project
        project.panel = panel._id;
        await project.save();
        console.log(`✅ Assigned "${projectName}" to Panel ${panel.panelName}`);
        successCount++;
    }

    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Total Processed: ${processedAssignments.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failureCount}`);

    process.exit(0);
};

executeAssignments();
