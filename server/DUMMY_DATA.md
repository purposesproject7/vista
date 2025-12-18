# Backend API Dummy Data Reference

This document provides dummy data for all backend API endpoints with proper formatting based on schemas, routes, controllers, and middlewares.

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Admin Endpoints](#admin-endpoints)
3. [Faculty Endpoints](#faculty-endpoints)
4. [Student Endpoints](#student-endpoints)
5. [Project Endpoints](#project-endpoints)
6. [Project Coordinator Endpoints](#project-coordinator-endpoints)

---

## Authentication Endpoints

### POST /auth/login
**Description:** User login  
**Required Fields:** emailId, password

```json
{
  "emailId": "anita.sharma@university.edu",
  "password": "Password123!"
}
```

### POST /auth/register
**Description:** Register new user  
**Required Fields:** name, emailId, password, employeeId, role

```json
{
  "name": "Dr. Anita Sharma",
  "emailId": "anita.sharma@university.edu",
  "password": "Password123!",
  "employeeId": "EMP001",
  "role": "faculty",
  "school": "SCOPE",
  "department": "Computer Science",
  "specialization": "Artificial Intelligence"
}
```

### POST /auth/forgot-password/send-otp
**Description:** Send OTP for password reset  
**Required Fields:** emailId

```json
{
  "emailId": "anita.sharma@university.edu"
}
```

### POST /auth/forgot-password/verify-otp
**Description:** Verify OTP and reset password  
**Required Fields:** emailId, otp, newPassword, confirmPassword

```json
{
  "emailId": "anita.sharma@university.edu",
  "otp": "123456",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### POST /auth/forgot-password/resend-otp
**Description:** Resend OTP  
**Required Fields:** emailId

```json
{
  "emailId": "anita.sharma@university.edu"
}
```

### POST /auth/forgot-password
**Description:** Token-based password reset request  
**Required Fields:** emailId

```json
{
  "emailId": "anita.sharma@university.edu"
}
```

### POST /auth/reset-password
**Description:** Reset password using token  
**Required Fields:** token, newPassword

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123!"
}
```

### PUT /auth/change-password
**Description:** Change password (authenticated)  
**Required Fields:** currentPassword, newPassword  
**Headers:** Authorization: Bearer {token}

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### GET /auth/verify-token
**Description:** Verify JWT token  
**Headers:** Authorization: Bearer {token}

### POST /auth/logout
**Description:** User logout  
**Headers:** Authorization: Bearer {token}

### GET /auth/profile
**Description:** Get user profile  
**Headers:** Authorization: Bearer {token}

---

## Admin Endpoints

**Note:** All admin endpoints require authentication and admin role.  
**Headers:** Authorization: Bearer {admin_token}

### GET /admin/master-data
**Description:** Get all master data (schools, departments, academic years, semesters)

### POST /admin/master-data/bulk
**Description:** Create master data in bulk  
**Required Fields:** schools, departments, academicYears

```json
{
  "schools": [
    {
      "name": "SCOPE",
      "code": "SCOPE"
    },
    {
      "name": "SENSE",
      "code": "SENSE"
    }
  ],
  "departments": [
    {
      "school": "SCOPE",
      "name": "Computer Science",
      "code": "CSE",
      "specializations": ["Artificial Intelligence", "Machine Learning", "Data Science"]
    },
    {
      "school": "SENSE",
      "name": "Electronics",
      "code": "ECE",
      "specializations": ["VLSI Design", "Signal Processing", "Embedded Systems"]
    }
  ],
  "academicYears": [
    {
      "year": "2024-2025",
      "isActive": true,
      "isCurrent": true
    },
    {
      "year": "2025-2026",
      "isActive": true,
      "isCurrent": false
    }
  ],
  "semesters": [
    {
      "name": "Fall Semester",
      "isActive": true
    },
    {
      "name": "Winter Semester",
      "isActive": true
    }
  ]
}
```

### POST /admin/master-data/schools
**Description:** Create a school  
**Required Fields:** name, code

```json
{
  "name": "VITBS",
  "code": "VITBS"
}
```

### PUT /admin/master-data/schools/:id
**Description:** Update a school

```json
{
  "isActive": false
}
```

### POST /admin/master-data/departments
**Description:** Create a department  
**Required Fields:** name, code, school

```json
{
  "school": "SCOPE",
  "name": "Information Technology",
  "code": "IT",
  "specializations": ["Cybersecurity", "Cloud Computing", "IoT"]
}
```

### PUT /admin/master-data/departments/:id
**Description:** Update a department

```json
{
  "specializations": ["Cybersecurity", "Cloud Computing", "IoT", "Blockchain"]
}
```

### POST /admin/master-data/academic-years
**Description:** Create academic year  
**Required Fields:** year

```json
{
  "year": "2026-2027",
  "isActive": true,
  "isCurrent": false
}
```

### GET /admin/department-config
**Description:** Get department configuration  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### POST /admin/department-config
**Description:** Create department configuration  
**Required Fields:** academicYear, semester, school, department

```json
{
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "minTeamSize": 2,
  "maxTeamSize": 4,
  "minPanelSize": 2,
  "maxPanelSize": 5,
  "featureLocks": [
    {
      "featureName": "student_upload",
      "deadline": "2024-08-31T23:59:59Z",
      "isLocked": false
    },
    {
      "featureName": "project_creation",
      "deadline": "2024-09-15T23:59:59Z",
      "isLocked": false
    }
  ]
}
```

### PUT /admin/department-config/:id
**Description:** Update department configuration

```json
{
  "minTeamSize": 1,
  "maxTeamSize": 5,
  "featureLocks": [
    {
      "featureName": "student_upload",
      "deadline": "2024-09-05T23:59:59Z",
      "isLocked": true
    }
  ]
}
```

### PATCH /admin/department-config/:id/feature-lock
**Description:** Update feature lock status

```json
{
  "featureName": "student_upload",
  "isLocked": true
}
```

### GET /admin/component-library
**Description:** Get component library  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### POST /admin/component-library
**Description:** Create component library  
**Required Fields:** academicYear, semester, school, department, components

```json
{
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "components": [
    {
      "name": "Literature Review",
      "description": "Quality of literature survey",
      "isPredefined": true
    },
    {
      "name": "Technical Implementation",
      "description": "Implementation quality and complexity",
      "isPredefined": true
    },
    {
      "name": "Innovation",
      "description": "Novel approach and creativity",
      "isPredefined": false
    }
  ]
}
```

### PUT /admin/component-library/:id
**Description:** Update component library

```json
{
  "components": [
    {
      "name": "Literature Review",
      "description": "Quality and depth of literature survey",
      "isPredefined": true
    }
  ]
}
```

### GET /admin/marking-schema
**Description:** Get marking schema  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### POST /admin/marking-schema
**Description:** Create or update marking schema  
**Required Fields:** academicYear, semester, school, department, reviews

```json
{
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "reviews": [
    {
      "reviewName": "review1",
      "displayName": "Review 1 - Proposal Defense",
      "facultyType": "both",
      "components": [
        {
          "componentId": "6475a1b2c3d4e5f6g7h8i9j0",
          "name": "Problem Definition",
          "maxMarks": 10,
          "description": "Clarity of problem statement"
        },
        {
          "componentId": "6475a1b2c3d4e5f6g7h8i9j1",
          "name": "Literature Survey",
          "maxMarks": 15,
          "description": "Depth of research"
        }
      ],
      "deadline": {
        "from": "2024-09-01T00:00:00Z",
        "to": "2024-09-30T23:59:59Z"
      },
      "pptRequired": true,
      "draftRequired": false,
      "order": 1,
      "isActive": true
    },
    {
      "reviewName": "review2",
      "displayName": "Review 2 - Progress Presentation",
      "facultyType": "both",
      "components": [
        {
          "componentId": "6475a1b2c3d4e5f6g7h8i9j2",
          "name": "Implementation Progress",
          "maxMarks": 20,
          "description": "Progress in implementation"
        },
        {
          "componentId": "6475a1b2c3d4e5f6g7h8i9j3",
          "name": "Technical Complexity",
          "maxMarks": 15,
          "description": "Complexity of solution"
        }
      ],
      "deadline": {
        "from": "2024-11-01T00:00:00Z",
        "to": "2024-11-30T23:59:59Z"
      },
      "pptRequired": true,
      "draftRequired": true,
      "order": 2,
      "isActive": true
    }
  ],
  "requiresContribution": true,
  "contributionTypes": ["Patent Filed", "Journal Publication"],
  "totalWeightage": 100
}
```

### PUT /admin/marking-schema/:id
**Description:** Update marking schema

```json
{
  "reviews": [
    {
      "reviewName": "review1",
      "displayName": "Review 1 - Updated",
      "isActive": false
    }
  ]
}
```

### GET /admin/faculty
**Description:** Get all faculty  
**Query Params:** school, department, specialization, sortBy, sortOrder

```
?school=SCOPE&department=Computer Science&sortBy=name&sortOrder=asc
```

### POST /admin/faculty
**Description:** Create faculty  
**Required Fields:** name, emailId, employeeId, password, role, school, department

```json
{
  "name": "Dr. Rajesh Kumar",
  "emailId": "rajesh.kumar@university.edu",
  "employeeId": "EMP002",
  "password": "Password123!",
  "role": "faculty",
  "school": "SCOPE",
  "department": "Computer Science",
  "specialization": "Data Science",
  "phoneNumber": "+91 9876543210"
}
```

### POST /admin/faculty/bulk
**Description:** Create multiple faculty  
**Required Fields:** facultyList

```json
{
  "facultyList": [
    {
      "name": "Dr. Priya Singh",
      "emailId": "priya.singh@university.edu",
      "employeeId": "EMP003",
      "password": "Password123!",
      "role": "faculty",
      "school": "SCOPE",
      "department": "Computer Science",
      "specialization": "Machine Learning"
    },
    {
      "name": "Dr. Suresh Verma",
      "emailId": "suresh.verma@university.edu",
      "employeeId": "EMP004",
      "password": "Password123!",
      "role": "faculty",
      "school": "SENSE",
      "department": "Electronics",
      "specialization": "VLSI Design"
    }
  ]
}
```

### POST /admin/faculty/admin
**Description:** Create admin user  
**Required Fields:** name, emailId, employeeId, password

```json
{
  "name": "Admin User",
  "emailId": "admin@university.edu",
  "employeeId": "ADMIN001",
  "password": "AdminPassword123!"
}
```

### PUT /admin/faculty/:employeeId
**Description:** Update faculty

```json
{
  "name": "Dr. Rajesh Kumar Updated",
  "phoneNumber": "+91 9876543211",
  "specialization": "Data Science and Analytics",
  "isActive": true
}
```

### DELETE /admin/faculty/:employeeId
**Description:** Delete faculty (soft delete)

### GET /admin/project-coordinators
**Description:** Get all project coordinators  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### POST /admin/project-coordinators
**Description:** Assign project coordinator  
**Required Fields:** facultyId, academicYear, semester, school, department

```json
{
  "facultyId": "6475a1b2c3d4e5f6g7h8i9j0",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "isPrimary": true,
  "permissions": {
    "canCreateFaculty": {
      "enabled": true,
      "useGlobalDeadline": true
    },
    "canUploadStudents": {
      "enabled": true,
      "deadline": "2024-08-31T23:59:59Z",
      "useGlobalDeadline": false
    },
    "canCreatePanels": {
      "enabled": true,
      "useGlobalDeadline": true
    },
    "canAssignGuides": {
      "enabled": true,
      "useGlobalDeadline": true
    }
  }
}
```

### PUT /admin/project-coordinators/:id
**Description:** Update project coordinator

```json
{
  "isPrimary": false,
  "isActive": true
}
```

### PATCH /admin/project-coordinators/:id/permissions
**Description:** Update coordinator permissions  
**Required Fields:** permissions

```json
{
  "permissions": {
    "canCreateFaculty": {
      "enabled": false
    },
    "canUploadStudents": {
      "enabled": true,
      "deadline": "2024-09-15T23:59:59Z"
    }
  }
}
```

### DELETE /admin/project-coordinators/:id
**Description:** Remove project coordinator

### GET /admin/students
**Description:** Get all students  
**Query Params:** school, department, academicYear, semester, regNo, name

```
?school=SCOPE&department=Computer Science&academicYear=2024-2025&semester=Fall Semester
```

### POST /admin/student
**Description:** Create student  
**Required Fields:** regNo, name, emailId, school, department, academicYear, semester

```json
{
  "regNo": "21BCE1001",
  "name": "Rajesh Kumar",
  "emailId": "rajesh.kumar@vitstudent.ac.in",
  "phoneNumber": "+91 9876543210",
  "school": "SCOPE",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "PAT": false
}
```

### POST /admin/student/bulk
**Description:** Bulk upload students  
**Required Fields:** students, academicYear, semester, school, department

```json
{
  "students": [
    {
      "regNo": "21BCE1001",
      "name": "Rajesh Kumar",
      "emailId": "rajesh.kumar@vitstudent.ac.in",
      "phoneNumber": "+91 9876543210"
    },
    {
      "regNo": "21BCE1002",
      "name": "Priya Singh",
      "emailId": "priya.singh@vitstudent.ac.in",
      "phoneNumber": "+91 9876543211"
    },
    {
      "regNo": "21BCE1003",
      "name": "Amit Patel",
      "emailId": "amit.patel@vitstudent.ac.in",
      "phoneNumber": "+91 9876543212"
    }
  ],
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science"
}
```

### PUT /admin/student/:regNo
**Description:** Update student

```json
{
  "name": "Rajesh Kumar Updated",
  "phoneNumber": "+91 9876543299",
  "emailId": "rajesh.updated@vitstudent.ac.in",
  "PAT": true
}
```

### DELETE /admin/student/:regNo
**Description:** Delete student (soft delete)

### GET /admin/student/:regNo
**Description:** Get student by registration number

### GET /admin/projects
**Description:** Get all projects  
**Query Params:** academicYear, semester, school, department, status, guideFaculty, panel

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science&status=active
```

### GET /admin/projects/guides
**Description:** Get all guides with their projects  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### GET /admin/projects/panels
**Description:** Get all panels with their projects  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### PATCH /admin/projects/:id/best-project
**Description:** Mark project as best project

```json
{
  "bestProject": true
}
```

### GET /admin/panels
**Description:** Get all panels  
**Query Params:** academicYear, semester, school, department, specialization

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### POST /admin/panels
**Description:** Create panel manually  
**Required Fields:** memberEmployeeIds, academicYear, semester, school, department

```json
{
  "memberEmployeeIds": ["EMP001", "EMP002", "EMP003"],
  "panelName": "Panel A - AI Projects",
  "venue": "Room 301, Block A",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "specializations": ["Artificial Intelligence", "Machine Learning"],
  "maxProjects": 10
}
```

### POST /admin/panels/auto-create
**Description:** Auto-create panels  
**Required Fields:** departments, school, academicYear, semester

```json
{
  "school": "SCOPE",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "departments": ["Computer Science", "Information Technology"],
  "panelSize": 3
}
```

### PUT /admin/panels/:id
**Description:** Update panel

```json
{
  "panelName": "Panel A - Updated",
  "venue": "Room 302, Block B",
  "maxProjects": 12,
  "isActive": true
}
```

### DELETE /admin/panels/:id
**Description:** Delete panel

### POST /admin/panels/assign
**Description:** Assign panel to project  
**Required Fields:** panelId, projectId

```json
{
  "panelId": "6475a1b2c3d4e5f6g7h8i9j0",
  "projectId": "6475a1b2c3d4e5f6g7h8i9j1"
}
```

### POST /admin/panels/auto-assign
**Description:** Auto-assign panels to projects  
**Required Fields:** academicYear, semester, school, department

```json
{
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science"
}
```

### GET /admin/requests
**Description:** Get all faculty requests  
**Query Params:** facultyType, academicYear, semester, school, department, status

```
?facultyType=guide&academicYear=2024-2025&semester=Fall Semester&status=pending
```

### PUT /admin/requests/:id/status
**Description:** Update request status  
**Required Fields:** status

```json
{
  "status": "approved",
  "remarks": "Extension approved for valid reasons"
}
```

### GET /admin/broadcasts
**Description:** Get all broadcast messages  
**Query Params:** isActive

```
?isActive=true
```

### POST /admin/broadcasts
**Description:** Create broadcast message  
**Required Fields:** message, expiresAt

```json
{
  "message": "System maintenance scheduled for Dec 20, 2024. All submissions will be unavailable from 10 PM to 2 AM.",
  "priority": "high",
  "targetAudience": ["faculty", "student"],
  "expiresAt": "2024-12-21T02:00:00Z",
  "blocksActions": true
}
```

### PUT /admin/broadcasts/:id
**Description:** Update broadcast message

```json
{
  "message": "System maintenance rescheduled to Dec 21, 2024.",
  "priority": "medium",
  "isActive": true
}
```

### DELETE /admin/broadcasts/:id
**Description:** Delete broadcast message

### GET /admin/reports/overview
**Description:** Get overview report  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### GET /admin/reports/projects
**Description:** Get projects report  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### GET /admin/reports/marks
**Description:** Get marks report  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### GET /admin/reports/faculty-workload
**Description:** Get faculty workload report  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

### GET /admin/reports/student-performance
**Description:** Get student performance report  
**Query Params:** academicYear, semester, school, department

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science
```

---

## Faculty Endpoints

**Note:** All faculty endpoints require authentication and faculty role.  
**Headers:** Authorization: Bearer {faculty_token}

### GET /faculty/profile
**Description:** Get faculty profile

### PUT /faculty/profile
**Description:** Update faculty profile

```json
{
  "name": "Dr. Anita Sharma Updated",
  "phoneNumber": "+91 9876543299",
  "specialization": "AI and Deep Learning"
}
```

### GET /faculty/projects
**Description:** Get assigned projects (guide and panel)  
**Query Params:** academicYear, semester, role

```
?academicYear=2024-2025&semester=Fall Semester&role=guide
```

### GET /faculty/projects/:id
**Description:** Get project details

### GET /faculty/students
**Description:** Get assigned students  
**Query Params:** academicYear, semester

```
?academicYear=2024-2025&semester=Fall Semester
```

### GET /faculty/marking-schema
**Description:** Get marking schema for faculty's department  
**Query Params:** academicYear, semester

```
?academicYear=2024-2025&semester=Fall Semester
```

### POST /faculty/marks
**Description:** Submit marks for a student  
**Required Fields:** student, project, reviewType, componentMarks, totalMarks, maxTotalMarks

```json
{
  "student": "6475a1b2c3d4e5f6g7h8i9j0",
  "project": "6475a1b2c3d4e5f6g7h8i9j1",
  "reviewType": "review1",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "facultyRole": "guide",
  "componentMarks": [
    {
      "componentId": "6475a1b2c3d4e5f6g7h8i9j2",
      "componentName": "Problem Definition",
      "marks": 8,
      "maxMarks": 10,
      "componentTotal": 8,
      "componentMaxTotal": 10,
      "remarks": "Well defined problem statement"
    },
    {
      "componentId": "6475a1b2c3d4e5f6g7h8i9j3",
      "componentName": "Literature Survey",
      "subComponents": [
        {
          "name": "Depth",
          "marks": 7,
          "maxMarks": 8,
          "isPredefined": true
        },
        {
          "name": "Relevance",
          "marks": 6,
          "maxMarks": 7,
          "isPredefined": true
        }
      ],
      "componentTotal": 13,
      "componentMaxTotal": 15,
      "remarks": "Good survey of recent works"
    }
  ],
  "totalMarks": 21,
  "maxTotalMarks": 25,
  "remarks": "Good start, needs more refinement"
}
```

### PUT /faculty/marks/:id
**Description:** Update marks

```json
{
  "componentMarks": [
    {
      "componentId": "6475a1b2c3d4e5f6g7h8i9j2",
      "componentName": "Problem Definition",
      "marks": 9,
      "maxMarks": 10,
      "componentTotal": 9,
      "componentMaxTotal": 10,
      "remarks": "Excellent problem definition"
    }
  ],
  "totalMarks": 22,
  "maxTotalMarks": 25,
  "remarks": "Updated after revision"
}
```

### GET /faculty/marks
**Description:** Get submitted marks  
**Query Params:** academicYear, semester, reviewType, studentId

```
?academicYear=2024-2025&semester=Fall Semester&reviewType=review1
```

### POST /faculty/approvals/ppt
**Description:** Approve PPT submission  
**Required Fields:** studentId, reviewType

```json
{
  "studentId": "6475a1b2c3d4e5f6g7h8i9j0",
  "reviewType": "review1",
  "remarks": "PPT approved with good content"
}
```

### POST /faculty/approvals/draft
**Description:** Approve draft submission  
**Required Fields:** studentId, reviewType

```json
{
  "studentId": "6475a1b2c3d4e5f6g7h8i9j0",
  "reviewType": "review2",
  "remarks": "Draft approved after revisions"
}
```

### POST /faculty/requests
**Description:** Create request (deadline extension, mark edit, resubmission)  
**Required Fields:** student, project, reviewType, requestType, reason

```json
{
  "student": "6475a1b2c3d4e5f6g7h8i9j0",
  "project": "6475a1b2c3d4e5f6g7h8i9j1",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "reviewType": "review1",
  "requestType": "deadline_extension",
  "reason": "Student was ill during the review period. Medical certificate attached.",
  "facultyType": "guide"
}
```

**Request Types:**
- `deadline_extension` - Request deadline extension
- `mark_edit` - Request to edit submitted marks
- `resubmission` - Request for student resubmission

### GET /faculty/panels
**Description:** Get assigned panels  
**Query Params:** academicYear, semester

```
?academicYear=2024-2025&semester=Fall Semester
```

### GET /faculty/broadcasts
**Description:** Get active broadcast messages

---

## Student Endpoints

### GET /student/profile/:regNo
**Description:** Get student profile by registration number

```
/student/profile/21BCE1001
```

### GET /student/project/:regNo
**Description:** Get project details for a student

```
/student/project/21BCE1001
```

### GET /student/marks/:regNo
**Description:** Get marks for a student (authenticated)  
**Headers:** Authorization: Bearer {student_token}

```
/student/marks/21BCE1001
```

### GET /student/approvals/:regNo
**Description:** Get approval status (PPT/draft) for a student (authenticated)  
**Headers:** Authorization: Bearer {student_token}

```
/student/approvals/21BCE1001
```

### GET /student/broadcasts
**Description:** Get active broadcast messages for students

---

## Project Endpoints

**Note:** All project endpoints require authentication.  
**Headers:** Authorization: Bearer {token}

### GET /projects/list
**Description:** Get all projects with filters  
**Query Params:** academicYear, semester, school, department, status, guideFaculty, panel

```
?academicYear=2024-2025&semester=Fall Semester&school=SCOPE&department=Computer Science&status=active
```

### GET /projects/:id
**Description:** Get single project by ID

```
/projects/6475a1b2c3d4e5f6g7h8i9j0
```

### GET /projects/student/:studentId
**Description:** Get projects by student ID

```
/projects/student/6475a1b2c3d4e5f6g7h8i9j0
```

### GET /projects/guide/:facultyId
**Description:** Get projects by guide faculty ID

```
/projects/guide/6475a1b2c3d4e5f6g7h8i9j0
```

### GET /projects/panel/:panelId
**Description:** Get projects by panel ID

```
/projects/panel/6475a1b2c3d4e5f6g7h8i9j0
```

### POST /projects/create
**Description:** Create single project  
**Required Fields:** name, students, guideFacultyEmpId, specialization, type

```json
{
  "name": "AI-Based Student Performance Prediction System",
  "students": ["21BCE1001", "21BCE1002"],
  "guideFacultyEmpId": "EMP001",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "school": "SCOPE",
  "department": "Computer Science",
  "specialization": "Artificial Intelligence",
  "type": "software"
}
```

**Project Types:**
- `software` - Software project
- `hardware` - Hardware project

### POST /projects/bulk
**Description:** Create multiple projects (bulk)  
**Required Fields:** school, department, projects, guideFacultyEmpId

```json
{
  "school": "SCOPE",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "semester": "Fall Semester",
  "guideFacultyEmpId": "EMP001",
  "projects": [
    {
      "name": "Machine Learning for Healthcare",
      "students": ["21BCE1003", "21BCE1004"],
      "specialization": "Machine Learning",
      "type": "software"
    },
    {
      "name": "IoT-Based Smart Home Automation",
      "students": ["21BCE1005"],
      "specialization": "Internet of Things",
      "type": "hardware"
    }
  ]
}
```

### PUT /projects/:id
**Description:** Update project details  
**Required Fields:** projectId

```json
{
  "projectId": "6475a1b2c3d4e5f6g7h8i9j0",
  "name": "AI-Based Student Performance Prediction System (Updated)",
  "type": "software",
  "status": "active"
}
```

**Project Status:**
- `active` - Project is active
- `inactive` - Project is inactive
- `completed` - Project is completed
- `archived` - Project is archived

### DELETE /projects/:id
**Description:** Delete project

```
/projects/6475a1b2c3d4e5f6g7h8i9j0
```

---

## Project Coordinator Endpoints

**Note:** All coordinator endpoints require authentication and project coordinator role.  
**Headers:** Authorization: Bearer {coordinator_token}

### GET /coordinator/profile
**Description:** Get coordinator profile

### GET /coordinator/permissions
**Description:** Get coordinator permissions

### GET /coordinator/faculty
**Description:** Get faculty list (department-specific)  
**Query Params:** specialization

```
?specialization=Artificial Intelligence
```

### POST /coordinator/faculty
**Description:** Create faculty (requires permission)  
**Required Fields:** name, emailId, employeeId, password, role, specialization

```json
{
  "name": "Dr. Kavita Deshmukh",
  "emailId": "kavita.deshmukh@university.edu",
  "employeeId": "EMP005",
  "password": "Password123!",
  "role": "faculty",
  "specialization": "Cloud Computing",
  "phoneNumber": "+91 9876543213"
}
```

### PUT /coordinator/faculty/:employeeId
**Description:** Update faculty (requires permission)

```json
{
  "name": "Dr. Kavita Deshmukh Updated",
  "specialization": "Cloud Computing and DevOps",
  "phoneNumber": "+91 9876543299"
}
```

### DELETE /coordinator/faculty/:employeeId
**Description:** Delete faculty (requires permission)

### GET /coordinator/students
**Description:** Get student list (department-specific)  
**Query Params:** regNo, name

```
?regNo=21BCE
```

### POST /coordinator/student
**Description:** Create student (requires permission)  
**Required Fields:** regNo, name, emailId

```json
{
  "regNo": "21BCE1010",
  "name": "Sneha Sharma",
  "emailId": "sneha.sharma@vitstudent.ac.in",
  "phoneNumber": "+91 9876543220",
  "PAT": false
}
```

### POST /coordinator/student/bulk
**Description:** Upload students in bulk (requires permission)  
**Required Fields:** students

```json
{
  "students": [
    {
      "regNo": "21BCE1011",
      "name": "Vikram Singh",
      "emailId": "vikram.singh@vitstudent.ac.in",
      "phoneNumber": "+91 9876543221"
    },
    {
      "regNo": "21BCE1012",
      "name": "Pooja Mehta",
      "emailId": "pooja.mehta@vitstudent.ac.in",
      "phoneNumber": "+91 9876543222"
    }
  ]
}
```

### PUT /coordinator/student/:regNo
**Description:** Update student (requires permission)

```json
{
  "name": "Sneha Sharma Updated",
  "phoneNumber": "+91 9876543299",
  "PAT": true
}
```

### DELETE /coordinator/student/:regNo
**Description:** Delete student (requires permission)

### GET /coordinator/student/:regNo
**Description:** Get student by registration number

### GET /coordinator/projects
**Description:** Get projects list (department-specific)  
**Query Params:** status, guideFaculty

```
?status=active
```

### POST /coordinator/projects
**Description:** Create project (requires permission)  
**Required Fields:** name, students, guideFacultyEmpId, specialization, type

```json
{
  "name": "Blockchain-Based Supply Chain",
  "students": ["21BCE1013", "21BCE1014"],
  "guideFacultyEmpId": "EMP002",
  "specialization": "Blockchain Technology",
  "type": "software"
}
```

### PUT /coordinator/projects/:id
**Description:** Update project (requires permission)

```json
{
  "name": "Blockchain-Based Supply Chain (Updated)",
  "status": "active"
}
```

### DELETE /coordinator/projects/:id
**Description:** Delete project (requires permission)

### POST /coordinator/projects/:id/assign-guide
**Description:** Assign guide to project (requires permission)  
**Required Fields:** guideFacultyEmpId

```json
{
  "guideFacultyEmpId": "EMP003"
}
```

### POST /coordinator/projects/:id/reassign-guide
**Description:** Reassign guide (requires permission)  
**Required Fields:** newGuideFacultyEmpId, reason

```json
{
  "newGuideFacultyEmpId": "EMP004",
  "reason": "Previous guide unavailable due to sabbatical"
}
```

### GET /coordinator/panels
**Description:** Get panels list (department-specific)

### POST /coordinator/panels
**Description:** Create panel (requires permission)  
**Required Fields:** memberEmployeeIds

```json
{
  "memberEmployeeIds": ["EMP001", "EMP002", "EMP003"],
  "panelName": "Panel B - Data Science Projects",
  "venue": "Room 201, Block C",
  "specializations": ["Data Science", "Machine Learning"],
  "maxProjects": 8
}
```

### PUT /coordinator/panels/:id
**Description:** Update panel (requires permission)

```json
{
  "panelName": "Panel B - Updated",
  "venue": "Room 202, Block C",
  "maxProjects": 10
}
```

### DELETE /coordinator/panels/:id
**Description:** Delete panel (requires permission)

### POST /coordinator/panels/:id/assign-project
**Description:** Assign project to panel (requires permission)  
**Required Fields:** projectId

```json
{
  "projectId": "6475a1b2c3d4e5f6g7h8i9j0"
}
```

### GET /coordinator/marking-schema
**Description:** Get marking schema (department-specific)

### POST /coordinator/marking-schema
**Description:** Create/update marking schema (requires permission)  
**Required Fields:** reviews

```json
{
  "reviews": [
    {
      "reviewName": "review1",
      "displayName": "Review 1 - Proposal",
      "facultyType": "both",
      "components": [
        {
          "componentId": "6475a1b2c3d4e5f6g7h8i9j0",
          "name": "Problem Statement",
          "maxMarks": 10
        }
      ],
      "deadline": {
        "from": "2024-09-01T00:00:00Z",
        "to": "2024-09-30T23:59:59Z"
      },
      "pptRequired": true,
      "order": 1
    }
  ]
}
```

### GET /coordinator/requests
**Description:** Get faculty requests (department-specific)  
**Query Params:** status, facultyType

```
?status=pending&facultyType=guide
```

### GET /coordinator/department-config
**Description:** Get department configuration

### PUT /coordinator/department-config
**Description:** Update department configuration (requires permission)

```json
{
  "minTeamSize": 2,
  "maxTeamSize": 4,
  "minPanelSize": 3,
  "maxPanelSize": 5
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Field 'emailId' is required",
    "Field 'password' must be at least 8 characters"
  ]
}
```

---

## Notes

1. **Authentication**: Most endpoints require JWT token in Authorization header
2. **Semester Field**: All academic context queries now require `semester` parameter along with `academicYear`
3. **Date Format**: All dates should be in ISO 8601 format (e.g., "2024-12-17T10:30:00Z")
4. **ObjectId Format**: MongoDB ObjectIds are 24-character hexadecimal strings
5. **Enum Values**:
   - Semester: `"Fall Semester"`, `"Winter Semester"`
   - Role: `"admin"`, `"faculty"`, `"student"`, `"project_coordinator"`
   - Project Type: `"software"`, `"hardware"`
   - Project Status: `"active"`, `"inactive"`, `"completed"`, `"archived"`
   - Faculty Type: `"guide"`, `"panel"`, `"both"`
   - Request Type: `"deadline_extension"`, `"mark_edit"`, `"resubmission"`
   - Request Status: `"pending"`, `"approved"`, `"rejected"`
   - Contribution Types: `"Patent Filed"`, `"Journal Publication"`, `"Book Chapter Contribution"`

6. **Feature Locks**: Available feature lock names:
   - `faculty_creation`
   - `panel_creation`
   - `student_upload`
   - `student_modification`
   - `project_creation`
   - `marking_schema_edit`
   - `guide_assignment`
   - `panel_assignment`
   - `guide_reassignment`
   - `team_merging`
   - `team_splitting`

---

**Last Updated:** December 17, 2025
