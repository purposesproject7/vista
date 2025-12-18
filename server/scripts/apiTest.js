// Try to use global fetch (Node 18+)
const fetch = global.fetch || (async (...args) => {
    const {default: fetch} = await import('node-fetch');
    return fetch(...args);
});

const BASE_URL = 'http://localhost:3000/api';

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

let state = {
    tokens: {
        admin: null,
        faculty: null,
        student: null
    },
    ids: {
        school: null,
        department: null,
        faculty: null,
        faculty2: null,
        student: null,
        project: null,
        panel: null,
        markingSchema: null,
        component: null
    },
    data: {
        schoolCode: "SCOPE",
        deptCode: "CSE",
        deptName: "Computer Science",
        academicYear: "2024-2025",
        semester: "Fall Semester"
    }
};

async function request(method, endpoint, data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const responseData = await response.json();
        return { status: response.status, data: responseData };
    } catch (error) {
        console.error(`${colors.red}Error requesting ${endpoint}:${colors.reset}`, error.message);
        return { status: 500, error: error.message };
    }
}

function logResult(testName, status, data, expectedStatus = 200) {
    const isSuccess = status === expectedStatus || (expectedStatus === 201 && status === 201);
    if (isSuccess) {
        console.log(`${colors.green}✓ ${testName} Passed${colors.reset}`);
    } else {
        console.log(`${colors.red}✗ ${testName} Failed (Status: ${status})${colors.reset}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }
    return isSuccess;
}

async function runTests() {
    console.log(`${colors.cyan}Starting API Tests...${colors.reset}\n`);

    // --- Authentication ---
    console.log(`${colors.yellow}--- Authentication Tests ---${colors.reset}`);

    let loginRes = await request('POST', '/auth/login', {
        emailId: "admin@vit.ac.in",
        password: "Vitadmin@123"
    });

    if (loginRes.status !== 200) {
        console.log(`${colors.red}Admin login failed.${colors.reset}`);
        return;
    }
    
    state.tokens.admin = loginRes.data.token || (loginRes.data.data && loginRes.data.data.token);
    logResult('Admin Login', loginRes.status, loginRes.data);

    // --- Admin: Master Data ---
    console.log(`\n${colors.yellow}--- Admin: Master Data Tests ---${colors.reset}`);

    // 1. Get Master Data
    let masterRes = await request('GET', '/admin/master-data', null, state.tokens.admin);
    let masterData = masterRes.data.data;
    
    console.log("Existing Schools:", masterData.schools.map(s => `${s.name} (${s.code})`).join(", "));
    console.log("Existing Departments:", masterData.departments.map(d => `${d.name} (${d.code}) in ${d.school}`).join(", "));

    // 2. Create School if not exists
    // Check by Code OR Name
    let school = masterData.schools.find(s => s.code === state.data.schoolCode || s.name === state.data.schoolCode);
    
    if (!school) {
        const schoolData = { name: state.data.schoolCode, code: state.data.schoolCode };
        let res = await request('POST', '/admin/master-data/schools', schoolData, state.tokens.admin);
        if (logResult('Create School', res.status, res.data, 201)) {
            // Refresh master data
            masterRes = await request('GET', '/admin/master-data', null, state.tokens.admin);
            masterData = masterRes.data.data;
            school = masterData.schools.find(s => s.code === state.data.schoolCode);
        }
    } else {
        console.log(`${colors.green}✓ School ${school.name} (${school.code}) already exists${colors.reset}`);
        // Update state to use the existing code if it differs
        state.data.schoolCode = school.code;
    }

    // 3. Create Department if not exists
    let dept = masterData.departments.find(d => (d.code === state.data.deptCode || d.name === state.data.deptName) && d.school === state.data.schoolCode);
    if (!dept) {
        const deptData = {
            school: state.data.schoolCode, 
            name: state.data.deptName,
            code: state.data.deptCode,
            specializations: ["Artificial Intelligence", "Machine Learning", "Data Science"]
        };
        let res = await request('POST', '/admin/master-data/departments', deptData, state.tokens.admin);
        logResult('Create Department', res.status, res.data, 201);
    } else {
        console.log(`${colors.green}✓ Department ${dept.name} (${dept.code}) already exists${colors.reset}`);
        state.data.deptCode = dept.code;
        state.data.deptName = dept.name;
    }

    // 4. Create Academic Year
    let year = masterData.academicYears.find(y => y.year === state.data.academicYear);
    if (!year) {
        const yearData = { year: state.data.academicYear, isActive: true, isCurrent: true };
        let res = await request('POST', '/admin/master-data/academic-years', yearData, state.tokens.admin);
        logResult('Create Academic Year', res.status, res.data, 201);
    } else {
        console.log(`${colors.green}✓ Academic Year ${state.data.academicYear} already exists${colors.reset}`);
    }

    // --- Admin: Department Config ---
    console.log(`\n${colors.yellow}--- Admin: Department Config Tests ---${colors.reset}`);
    const configQuery = `academicYear=${encodeURIComponent(state.data.academicYear)}&semester=${encodeURIComponent(state.data.semester)}&school=${encodeURIComponent(state.data.schoolCode)}&department=${encodeURIComponent(state.data.deptName)}`;
    let configRes = await request('GET', `/admin/department-config?${configQuery}`, null, state.tokens.admin);
    
    if (configRes.status !== 200) {
        const deptConfigData = {
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            minTeamSize: 1,
            maxTeamSize: 4,
            minPanelSize: 2,
            maxPanelSize: 5,
            featureLocks: []
        };
        let res = await request('POST', '/admin/department-config', deptConfigData, state.tokens.admin);
        logResult('Create Department Config', res.status, res.data, 201);
    } else {
        console.log(`${colors.green}✓ Department Config already exists${colors.reset}`);
    }

    // --- Admin: Component Library ---
    console.log(`\n${colors.yellow}--- Admin: Component Library Tests ---${colors.reset}`);
    let compRes = await request('GET', `/admin/component-library?${configQuery}`, null, state.tokens.admin);
    
    if (compRes.status === 200 && compRes.data.data && compRes.data.data.components.length > 0) {
        state.ids.component = compRes.data.data.components[0]._id || compRes.data.data.components[0].componentId;
        console.log(`${colors.green}✓ Component Library exists${colors.reset}`);
        console.log("Existing Component Library:", JSON.stringify(compRes.data.data, null, 2));
    } else {
        const componentLibData = {
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            components: [
                {
                    name: "Problem Definition",
                    description: "Quality of problem statement",
                    isPredefined: true
                }
            ]
        };
        let res = await request('POST', '/admin/component-library', componentLibData, state.tokens.admin);
        if (logResult('Create Component Library', res.status, res.data, 201)) {
            state.ids.component = res.data.data.components[0]._id;
            console.log("Created Component Library:", JSON.stringify(res.data.data, null, 2));
        }
    }

    // Verify Component Library Existence via API
    let verifyLib = await request('GET', `/admin/component-library?${configQuery}`, null, state.tokens.admin);
    if (verifyLib.status === 200) {
        console.log("Verified Component Library exists via API.");
    } else {
        console.log("Failed to verify Component Library via API:", verifyLib.status);
    }

    // --- Admin: Marking Schema ---
    console.log(`\n${colors.yellow}--- Admin: Marking Schema Tests ---${colors.reset}`);
    if (state.ids.component) {
        const markingSchemaData = {
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            reviews: [
                {
                    reviewName: "review1",
                    displayName: "Review 1",
                    facultyType: "both",
                    components: [
                        { 
                            componentId: state.ids.component,
                            name: "Problem Definition", 
                            maxMarks: 10, 
                            description: "Clarity" 
                        }
                    ],
                    deadline: { from: "2024-09-01T00:00:00Z", to: "2024-09-30T23:59:59Z" },
                    pptRequired: true,
                    draftRequired: false,
                    order: 1,
                    isActive: true
                }
            ],
            requiresContribution: true,
            contributionTypes: ["Patent Filed"],
            totalWeightage: 100
        };
        let res = await request('POST', '/admin/marking-schema', markingSchemaData, state.tokens.admin);
        if (res.status === 200 || res.status === 201) {
            console.log(`${colors.green}✓ Marking Schema Created/Updated${colors.reset}`);
        } else {
            logResult('Create Marking Schema', res.status, res.data);
        }
    } else {
        console.log(`${colors.red}Skipping Marking Schema (No Component ID)${colors.reset}`);
    }

    // --- Admin: Faculty ---
    console.log(`\n${colors.yellow}--- Admin: Faculty Tests ---${colors.reset}`);
    
    const timestamp = Date.now();
    const randomPhone = 9000000000 + Math.floor(Math.random() * 1000000000);
    // Faculty 1 (Guide)
    const facultyData = {
        name: "Dr. Rajesh Kumar",
        emailId: `rajesh.kumar.${timestamp}@vit.ac.in`, 
        employeeId: `EMP${timestamp}`,
        password: "Password123!",
        role: "faculty",
        school: state.data.schoolCode,
        department: state.data.deptName,
        specialization: "Data Science",
        phoneNumber: `+91 ${randomPhone}`
    };
    
    let facRes = await request('POST', '/admin/faculty', facultyData, state.tokens.admin);
    logResult('Create Faculty 1', facRes.status, facRes.data, 201);
    if (facRes.status === 201) state.ids.faculty = facRes.data.data._id;

    // Faculty 2 (Panel Member)
    const faculty2Data = {
        name: "Dr. Priya Singh",
        emailId: `priya.singh.${timestamp}@vit.ac.in`, 
        employeeId: `EMP${timestamp+1}`,
        password: "Password123!",
        role: "faculty",
        school: state.data.schoolCode,
        department: state.data.deptName,
        specialization: "Data Science",
        phoneNumber: `+91 ${randomPhone+1}`
    };
    
    let fac2Res = await request('POST', '/admin/faculty', faculty2Data, state.tokens.admin);
    logResult('Create Faculty 2', fac2Res.status, fac2Res.data, 201);
    if (fac2Res.status === 201) state.ids.faculty2 = fac2Res.data.data._id;

    // Login as Faculty 1
    let facLogin = await request('POST', '/auth/login', { emailId: facultyData.emailId, password: facultyData.password });
    if (facLogin.status === 200) {
        state.tokens.faculty = facLogin.data.token || (facLogin.data.data && facLogin.data.data.token);
        console.log(`${colors.green}✓ Faculty Login Passed${colors.reset}`);
    } else {
        logResult('Faculty Login', facLogin.status, facLogin.data);
    }

    // --- Admin: Student ---
    console.log(`\n${colors.yellow}--- Admin: Student Tests ---${colors.reset}`);

    const studentData = {
        regNo: `21BCE${timestamp}`,
        name: "Rajesh Student",
        emailId: `rajesh.student.${timestamp}@vitstudent.ac.in`,
        phoneNumber: `+91 ${randomPhone+2}`,
        school: state.data.schoolCode,
        department: state.data.deptName,
        academicYear: state.data.academicYear,
        semester: state.data.semester,
        PAT: false
    };
    let stuRes = await request('POST', '/admin/student', studentData, state.tokens.admin);
    logResult('Create Student', stuRes.status, stuRes.data, 201);
    if (stuRes.status === 201) state.ids.student = stuRes.data.data._id;

    // --- Admin: Project Coordinator ---
    console.log(`\n${colors.yellow}--- Admin: Project Coordinator Tests ---${colors.reset}`);
    
    if (state.ids.faculty) {
        const coordinatorData = {
            facultyId: state.ids.faculty,
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            isPrimary: true,
            permissions: {
                canCreateFaculty: { enabled: true, useGlobalDeadline: true },
                canUploadStudents: { enabled: true, deadline: "2024-08-31T23:59:59Z", useGlobalDeadline: false },
                canCreatePanels: { enabled: true, useGlobalDeadline: true },
                canAssignGuides: { enabled: true, useGlobalDeadline: true }
            }
        };
        let coordRes = await request('POST', '/admin/project-coordinators', coordinatorData, state.tokens.admin);
        logResult('Assign Project Coordinator', coordRes.status, coordRes.data, 201);
    }

    // --- Projects ---
    console.log(`\n${colors.yellow}--- Project Tests ---${colors.reset}`);
    // Create Project
    if (state.ids.student && state.ids.faculty) {
        const projectData = {
            name: "AI Project " + timestamp,
            students: [studentData.regNo],
            guideFacultyEmpId: facultyData.employeeId,
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            specialization: "Data Science",
            type: "software"
        };
        let projRes = await request('POST', '/projects/create', projectData, state.tokens.admin);
        logResult('Create Project', projRes.status, projRes.data, 201);
        if (projRes.status === 201) state.ids.project = projRes.data.data.projectId;
    } else {
        console.log(`${colors.red}Skipping Project Creation (Missing Student or Faculty)${colors.reset}`);
    }

    // --- Admin: Panels ---
    console.log(`\n${colors.yellow}--- Admin: Panel Tests ---${colors.reset}`);
    if (state.ids.faculty && state.ids.faculty2) {
        const panelData = {
            memberEmployeeIds: [facultyData.employeeId, faculty2Data.employeeId],
            panelName: "Panel " + timestamp,
            venue: "Room 301",
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            school: state.data.schoolCode,
            department: state.data.deptName,
            specializations: ["Data Science"],
            maxProjects: 10
        };
        let panelRes = await request('POST', '/admin/panels', panelData, state.tokens.admin);
        logResult('Create Panel', panelRes.status, panelRes.data, 201);
        if (panelRes.status === 201) state.ids.panel = panelRes.data.data._id;
    } else {
        console.log(`${colors.red}Skipping Panel Creation (Missing Faculty Members)${colors.reset}`);
    }

    // Assign Panel to Project
    if (state.ids.panel && state.ids.project) {
        let assignRes = await request('POST', '/admin/panels/assign', {
            panelId: state.ids.panel,
            projectId: state.ids.project
        }, state.tokens.admin);
        logResult('Assign Panel to Project', assignRes.status, assignRes.data, 200);
    }

    // --- Faculty Actions ---
    console.log(`\n${colors.yellow}--- Faculty Actions Tests ---${colors.reset}`);
    if (state.tokens.faculty && state.ids.project && state.ids.student && state.ids.component) {
        const marksData = {
            student: state.ids.student,
            project: state.ids.project,
            reviewType: "review1",
            academicYear: state.data.academicYear,
            semester: state.data.semester,
            facultyRole: "guide",
            componentMarks: [
                {
                    componentId: state.ids.component,
                    componentName: "Problem Definition",
                    marks: 8,
                    maxMarks: 10,
                    componentTotal: 8,
                    componentMaxTotal: 10,
                    remarks: "Good"
                }
            ],
            totalMarks: 8,
            maxTotalMarks: 10,
            remarks: "Good start"
        };
        
        let marksRes = await request('POST', '/faculty/marks', marksData, state.tokens.faculty);
        logResult('Submit Marks', marksRes.status, marksRes.data, 201);
    } else {
        console.log(`${colors.red}Skipping Marks Submission (Missing dependencies)${colors.reset}`);
    }

    console.log(`\n${colors.cyan}Tests Completed.${colors.reset}`);
}

runTests();
