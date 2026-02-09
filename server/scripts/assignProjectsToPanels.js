import mongoose from 'mongoose';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Import models
import Project from '../models/projectSchema.js';
import Panel from '../models/panelSchema.js';

const EXCEL_FILE = path.join(__dirname, 'multidisc upload/Projects_Bulk_Template_PanelStrings_2026-02-09.xlsx');

/**
 * Extract panel name by removing the number prefix
 * Example: "52350 Asha Jerlin M" -> "Asha Jerlin M"
 */
function extractPanelName(panelString) {
    if (!panelString) return null;

    // Remove leading numbers and whitespace
    const cleaned = panelString.trim().replace(/^\d+\s+/, '');
    return cleaned || null;
}

/**
 * Assign projects to panels based on Excel data
 */
async function assignProjectsToPanels() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Read Excel file
        console.log(`\nReading Excel file: ${EXCEL_FILE}`);
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} rows in Excel file`);

        // Process each row
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const projectName = row['Project Name'] || row['name'] || row['Name'];
            const panelString = row['Panel'] || row['panel'];

            if (!projectName) {
                console.log(`Row ${i + 1}: Skipping - no project name`);
                continue;
            }

            if (!panelString) {
                console.log(`Row ${i + 1}: Skipping - no panel for project "${projectName}"`);
                continue;
            }

            // Extract panel name
            const panelName = extractPanelName(panelString);

            if (!panelName) {
                console.log(`Row ${i + 1}: Could not extract panel name from "${panelString}"`);
                errorCount++;
                errors.push({ row: i + 1, projectName, panelString, error: 'Could not extract panel name' });
                continue;
            }

            try {
                // Find project by name
                const project = await Project.findOne({ name: projectName });

                if (!project) {
                    console.log(`Row ${i + 1}: Project "${projectName}" not found`);
                    errorCount++;
                    errors.push({ row: i + 1, projectName, panelName, error: 'Project not found' });
                    continue;
                }

                // Find panel by member name
                const panel = await Panel.findOne({
                    'members.name': panelName
                });

                if (!panel) {
                    console.log(`Row ${i + 1}: Panel with member "${panelName}" not found`);
                    errorCount++;
                    errors.push({ row: i + 1, projectName, panelName, error: 'Panel not found' });
                    continue;
                }

                // Assign panel to project
                project.panelId = panel._id;
                await project.save();

                console.log(`✓ Row ${i + 1}: Assigned project "${projectName}" to panel "${panel.name}" (member: ${panelName})`);
                successCount++;

            } catch (error) {
                console.error(`Row ${i + 1}: Error processing project "${projectName}":`, error.message);
                errorCount++;
                errors.push({ row: i + 1, projectName, panelName, error: error.message });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('ASSIGNMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total rows processed: ${data.length}`);
        console.log(`Successfully assigned: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(err => {
                console.log(`  Row ${err.row}: ${err.projectName} -> ${err.panelName || err.panelString} - ${err.error}`);
            });
        }

        console.log('='.repeat(60));

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

// Run the script
assignProjectsToPanels();
