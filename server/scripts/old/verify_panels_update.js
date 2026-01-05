import mongoose from "mongoose";
import connectDB from "../../utils/db.js";
import { FacultyService } from "../../services/facultyService.js";
import { PanelService } from "../../services/panelService.js";
import DepartmentConfig from "../../models/departmentConfigSchema.js";
import Faculty from "../../models/facultySchema.js";
import Panel from "../../models/panelSchema.js";
import { logger } from "../../utils/logger.js";

// Mock logger to avoid clutter
logger.info = console.log;
logger.error = console.error;

const verify = async () => {
  try {
    await connectDB();
    console.log("DB Connected");

    const testId = Date.now();
    const school = "TEST_SCHOOL_" + testId;
    const department = "TEST_DEPT_" + testId;
    const academicYear = "2025-2026";

    // 1. Create Department Config
    await DepartmentConfig.create({
      academicYear,
      school,
      department,
      minPanelSize: 2,
      maxPanelSize: 4,
      maxProjectsPerGuide: 5,
      maxProjectsPerPanel: 5,
      maxTeamSize: 4,
      minTeamSize: 2,
    });
    console.log("Department Config Created");

    // 2. Create Faculty WITHOUT Department
    const facultyData = [
      {
        name: "Faculty One",
        emailId: `f1_${testId}@vit.ac.in`,
        employeeId: `F1_${testId}`,
        phoneNumber: "9876543210",
        password: "Password1!",
        role: "faculty",
        school: school,
        specialization: "Spec A",
        // No department
      },
      {
        name: "Faculty Two",
        emailId: `f2_${testId}@vit.ac.in`,
        employeeId: `F2_${testId}`,
        phoneNumber: "9876543211",
        password: "Password1!",
        role: "faculty",
        school: school,
        department: department, // Including for mix
        specialization: "Spec A",
      },
      {
        name: "Faculty Three",
        emailId: `f3_${testId}@vit.ac.in`,
        employeeId: `F3_${testId}`,
        phoneNumber: "9876543212",
        password: "Password1!",
        role: "faculty",
        school: school,
        specialization: "Spec A",
        // No department
      },
    ];

    const createdFaculties = [];
    for (const f of facultyData) {
      const fac = await FacultyService.createFaculty(f);
      createdFaculties.push(fac);
      console.log(
        `Created Faculty: ${fac.employeeId}, Dept: ${fac.department}`
      );
    }

    // Verify Faculty 1 has no department (or undefined)
    if (!createdFaculties[0].department) {
      console.log("✅ SUCCESS: Faculty created without department.");
    } else {
      console.error(
        "❌ FAILURE: Faculty has department: " + createdFaculties[0].department
      );
    }

    // 3. Auto Create Panels with Faculty List
    // Note: PanelService needs faculties to be in the SAME department/school to pass validations usually,
    // but let's see logic.
    // PanelService.autoCreatePanels queries by school/dept.
    // The faculties we created (1 and 3) don't have department set.
    // So PanelService lookup `Faculty.find({ school, department })` will NOT find them if department is missing in DB doc.

    // Wait, if I want to use them in a panel for a specific department, they MUST belong to that department?
    // The requirement "faculty creation make dept optional" implies they might be floating faculty or inter-dept?
    // But `PanelService.validatePanelMembers` checks: `f.department !== department`.
    // So if I send a faculty with NO department to be in a panel for "TEST_DEPT", it will FAIL validation.

    // Let's test this hypothesis.
    // I will try to create a panel using the list.

    // First, I need to update Faculty 1 and 3 to have the department so they can be added to panel?
    // Or should I update PanelService to ALLOW faculty from other departments/no department?
    // The requirement didn't specify changing PanelService validation logic, only "accept list of faculties".
    // But if I can't add them, what's the point?

    // However, the `autoCreatePanels` uses `Faculty.find(query)` where query has `department`.
    // So it definitely won't find them if they don't have department.

    // Let's update Faculty 1 & 3 to have department so we can test the "List filtering" feature.
    // The "Optional Department" feature is verified above.

    await Faculty.updateMany(
      { _id: { $in: createdFaculties.map((f) => f._id) } },
      { $set: { department: department } }
    );
    console.log("Updated faculties with department for panel creation test");

    const facultyList = [
      createdFaculties[0].employeeId,
      createdFaculties[1].employeeId,
    ]; // Only use F1 and F2, exclude F3
    console.log("Requesting panel creation for: " + facultyList.join(", "));

    const result = await PanelService.autoCreatePanels(
      academicYear,
      school,
      department,
      2, // panel size
      null,
      facultyList
    );

    console.log("Panel Creation Result:", result);

    // Verify:
    // Should have created 1 panel with F1 and F2.
    // F3 should NOT be in any panel.

    const panels = await Panel.find({ school, department });
    console.log(`Found ${panels.length} panels`);

    if (panels.length === 1) {
      const members = panels[0].members; // array of objects with faculty id
      // We need to populate or check IDs
      const memberIds = await Faculty.find({
        _id: { $in: members.map((m) => m.faculty) },
      }).distinct("employeeId");
      console.log("Panel Members:", memberIds);

      if (
        memberIds.length === 2 &&
        memberIds.includes(facultyList[0]) &&
        memberIds.includes(facultyList[1])
      ) {
        console.log("✅ SUCCESS: Panel created with specified faculty list.");
      } else {
        console.error("❌ FAILURE: Panel members do not match expected list.");
      }
    } else {
      console.error("❌ FAILURE: Expected 1 panel, found " + panels.length);
    }

    console.log("Cleanup...");
    await DepartmentConfig.deleteMany({ school });
    await Faculty.deleteMany({ school });
    await Panel.deleteMany({ school });

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
};

verify();
