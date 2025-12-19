# API Documentation - Vista Project Management System

> **Base URL:** `http://localhost:5000/api` (Development)  
> **Authentication:** JWT Bearer Token (Required for most endpoints)

## Table of Contents
1. [Authentication](#authentication)
2. [Admin Routes](#admin-routes)
3. [Project Coordinator Routes](#project-coordinator-routes)
4. [Faculty Routes](#faculty-routes)
5. [Student Routes](#student-routes)
6. [Project Routes](#project-routes)
7. [Common Response Formats](#common-response-formats)
8. [Error Codes](#error-codes)

---

## Authentication

### 1. Login
**POST** `/auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "emailId": "admin@example.com",
  "password": "password123",
  "expectedRole": "admin" // Optional: "admin", "faculty"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "emailId": "admin@example.com",
    "employeeId": "EMP001",
    "role": "admin",
    "school": "School of Engineering",
    "department": "Computer Science",
    "isProjectCoordinator": false,
    "isActive": true
  }
}
```

### 2. Register
**POST** `/auth/register`

**Description:** Register a new user

**Request Body:**
```json
{
  "name": "Jane Smith",
  "emailId": "jane@example.com",
  "password": "password123",
  "employeeId": "EMP002",
  "role": "faculty"
}
```

**Response:** Same as login

### 3. Forgot Password (Send OTP)
**POST** `/auth/forgot-password/send-otp`

**Request Body:**
```json
{
  "emailId": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### 4. Verify OTP and Reset Password
**POST** `/auth/forgot-password/verify-otp`

**Request Body:**
```json
{
  "emailId": "user@example.com",
  "otp": "123456",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### 5. Resend OTP
**POST** `/auth/forgot-password/resend-otp`

**Request Body:**
```json
{
  "emailId": "user@example.com"
}
```

### 6. Change Password (Authenticated)
**PUT** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

### 7. Verify Token
**GET** `/auth/verify-token`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "emailId": "user@example.com",
    "role": "faculty"
  }
}
```

### 8. Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

### 9. Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

---

## Admin Routes

> **Base Path:** `/admin`  
> **Auth Required:** Yes (Role: admin)

### Master Data Management

#### 1. Get Master Data
**GET** `/admin/master-data`

**Response:**
```json
{
  "success": true,
  "data": {
    "schools": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "School of Engineering",
        "code": "SOE"
      }
    ],
    "departments": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Computer Science",
        "code": "CSE",
        "school": "64f8a1b2c3d4e5f6a7b8c9d0"
      }
    ],
    "academicYears": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "year": "2024-2025"
      }
    ]
  }
}
```

#### 2. Create Master Data (Bulk)
**POST** `/admin/master-data/bulk`

**Request Body:**
```json
{
  "schools": [
    { "name": "School of Engineering", "code": "SOE" },
    { "name": "School of Business", "code": "SOB" }
  ],
  "departments": [
    { "name": "Computer Science", "code": "CSE", "school": "SOE" },
    { "name": "Mechanical Engineering", "code": "ME", "school": "SOE" }
  ],
  "academicYears": [
    { "year": "2024-2025" },
    { "year": "2025-2026" }
  ]
}
```

#### 3. Create School
**POST** `/admin/master-data/schools`

**Request Body:**
```json
{
  "name": "School of Law",
  "code": "SOL"
}
```

#### 4. Update School
**PUT** `/admin/master-data/schools/:id`

**Request Body:**
```json
{
  "name": "School of Law & Governance",
  "code": "SOLG"
}
```

#### 5. Create Department
**POST** `/admin/master-data/departments`

**Request Body:**
```json
{
  "name": "Civil Engineering",
  "code": "CE",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

#### 6. Update Department
**PUT** `/admin/master-data/departments/:id`

**Request Body:**
```json
{
  "name": "Civil & Environmental Engineering",
  "code": "CEE"
}
```

#### 7. Create Academic Year
**POST** `/admin/master-data/academic-years`

**Request Body:**
```json
{
  "year": "2026-2027"
}
```

### Department Configuration

#### 8. Get Department Config
**GET** `/admin/department-config`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

**Example:** `/admin/department-config?academicYear=2024-2025&school=SOE&department=CSE`

#### 9. Create Department Config
**POST** `/admin/department-config`

**Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "teamSizeMin": 1,
  "teamSizeMax": 4,
  "panelSizeMin": 3,
  "panelSizeMax": 5,
  "reviewTypes": ["Review 1", "Review 2", "Review 3", "Final Review"],
  "featureLocks": {
    "lockStudentUpload": false,
    "lockProjectCreation": false,
    "lockGuideAssignment": false,
    "lockPanelCreation": false,
    "lockPanelAssignment": false
  }
}
```

#### 10. Update Department Config
**PUT** `/admin/department-config/:id`

**Request Body:** Same as create (all fields optional)

#### 11. Update Feature Lock
**PATCH** `/admin/department-config/:id/feature-lock`

**Request Body:**
```json
{
  "lockStudentUpload": true,
  "lockProjectCreation": false
}
```

### Component Library

#### 12. Get Component Library
**GET** `/admin/component-library`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 13. Create Component Library
**POST** `/admin/component-library`

**Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "components": [
    {
      "name": "Documentation",
      "maxMarks": 20
    },
    {
      "name": "Presentation",
      "maxMarks": 15
    },
    {
      "name": "Implementation",
      "maxMarks": 40
    }
  ]
}
```

#### 14. Update Component Library
**PUT** `/admin/component-library/:id`

**Request Body:** Same as create

### Marking Schema

#### 15. Get Marking Schema
**GET** `/admin/marking-schema`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 16. Create/Update Marking Schema
**POST** `/admin/marking-schema`

**Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "reviews": [
    {
      "reviewType": "Review 1",
      "deadline": "2025-03-15T23:59:59.000Z",
      "components": [
        {
          "componentId": "64f8a1b2c3d4e5f6a7b8c9d3",
          "maxMarks": 20
        }
      ]
    },
    {
      "reviewType": "Review 2",
      "deadline": "2025-05-20T23:59:59.000Z",
      "components": [
        {
          "componentId": "64f8a1b2c3d4e5f6a7b8c9d3",
          "maxMarks": 15
        }
      ]
    }
  ]
}
```

#### 17. Update Marking Schema
**PUT** `/admin/marking-schema/:id`

**Request Body:** Same as create

### Faculty Management

#### 18. Get All Faculty
**GET** `/admin/faculty`

**Query Params (optional):**
- `school`
- `department`
- `role`

#### 19. Create Faculty
**POST** `/admin/faculty`

**Request Body:**
```json
{
  "name": "Dr. John Smith",
  "emailId": "john.smith@example.com",
  "employeeId": "FAC001",
  "password": "password123",
  "role": "faculty",
  "school": "School of Engineering",
  "department": "Computer Science",
  "specialization": "Machine Learning",
  "phoneNumber": "+1234567890"
}
```

#### 20. Create Faculty (Bulk)
**POST** `/admin/faculty/bulk`

**Request Body:**
```json
{
  "facultyList": [
    {
      "name": "Dr. John Smith",
      "emailId": "john.smith@example.com",
      "employeeId": "FAC001",
      "password": "password123",
      "role": "faculty",
      "school": "School of Engineering",
      "department": "Computer Science",
      "specialization": "Machine Learning"
    },
    {
      "name": "Dr. Jane Doe",
      "emailId": "jane.doe@example.com",
      "employeeId": "FAC002",
      "password": "password123",
      "role": "faculty",
      "school": "School of Engineering",
      "department": "Computer Science",
      "specialization": "Data Science"
    }
  ]
}
```

#### 21. Create Admin
**POST** `/admin/faculty/admin`

**Request Body:**
```json
{
  "name": "Admin User",
  "emailId": "admin@example.com",
  "employeeId": "ADM001",
  "password": "adminPassword123"
}
```

#### 22. Update Faculty
**PUT** `/admin/faculty/:employeeId`

**Request Body:**
```json
{
  "name": "Dr. John Smith Updated",
  "specialization": "AI & Machine Learning",
  "phoneNumber": "+1234567890"
}
```

#### 23. Delete Faculty
**DELETE** `/admin/faculty/:employeeId`

### Project Coordinators

#### 24. Get Project Coordinators
**GET** `/admin/project-coordinators`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`

#### 25. Assign Project Coordinator
**POST** `/admin/project-coordinators`

**Request Body:**
```json
{
  "facultyId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d2",
  "department": "64f8a1b2c3d4e5f6a7b8c9d3",
  "permissions": {
    "canCreateFaculty": true,
    "canEditFaculty": true,
    "canDeleteFaculty": false,
    "canUploadStudents": true,
    "canModifyStudents": true,
    "canDeleteStudents": false,
    "canCreateProjects": true,
    "canEditProjects": true,
    "canDeleteProjects": false,
    "canAssignGuides": true,
    "canReassignGuides": true,
    "canCreatePanels": true,
    "canEditPanels": true,
    "canDeletePanels": false,
    "canAssignPanels": true,
    "canReassignPanels": true,
    "canMergeTeams": true,
    "canSplitTeams": true,
    "canEditMarkingSchema": false,
    "canManageRequests": true,
    "canCreateBroadcasts": true,
    "canEditBroadcasts": true,
    "canDeleteBroadcasts": true
  }
}
```

#### 26. Update Project Coordinator
**PUT** `/admin/project-coordinators/:id`

**Request Body:** Same as assign (all fields optional)

#### 27. Update Coordinator Permissions
**PATCH** `/admin/project-coordinators/:id/permissions`

**Request Body:**
```json
{
  "permissions": {
    "canCreateFaculty": false,
    "canDeleteProjects": true
  }
}
```

#### 28. Remove Project Coordinator
**DELETE** `/admin/project-coordinators/:id`

### Students Management

#### 29. Get All Students
**GET** `/admin/students`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`
- `page` (default: 1)
- `limit` (default: 50)

#### 30. Create Student
**POST** `/admin/student`

**Request Body:**
```json
{
  "regNo": "20241001",
  "name": "Alice Johnson",
  "emailId": "alice@example.com",
  "school": "School of Engineering",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "PAT": false
}
```

#### 31. Bulk Upload Students
**POST** `/admin/student/bulk`

**Request Body:**
```json
{
  "students": [
    {
      "regNo": "20241001",
      "name": "Alice Johnson",
      "emailId": "alice@example.com",
      "PAT": false
    },
    {
      "regNo": "20241002",
      "name": "Bob Smith",
      "emailId": "bob@example.com",
      "PAT": false
    }
  ],
  "academicYear": "2024-2025",
  "school": "School of Engineering",
  "department": "Computer Science"
}
```

#### 32. Update Student
**PUT** `/admin/student/:regNo`

**Request Body:**
```json
{
  "name": "Alice Johnson Updated",
  "emailId": "alice.new@example.com",
  "PAT": true
}
```

#### 33. Delete Student
**DELETE** `/admin/student/:regNo`

#### 34. Get Student by Reg No
**GET** `/admin/student/:regNo`

### Projects Management

#### 35. Get All Projects
**GET** `/admin/projects`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`
- `guideFaculty`
- `panel`

#### 36. Get All Guides with Projects
**GET** `/admin/projects/guides`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`

#### 37. Get All Panels with Projects
**GET** `/admin/projects/panels`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`

#### 38. Mark as Best Project
**PATCH** `/admin/projects/:id/best-project`

**Request Body:**
```json
{
  "isBestProject": true
}
```

### Panels Management

#### 39. Get All Panels
**GET** `/admin/panels`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`

#### 40. Create Panel Manually
**POST** `/admin/panels`

**Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC003"],
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

#### 41. Auto Create Panels
**POST** `/admin/panels/auto-create`

**Request Body:**
```json
{
  "departments": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### 42. Update Panel
**PUT** `/admin/panels/:id`

**Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC004"]
}
```

#### 43. Delete Panel
**DELETE** `/admin/panels/:id`

#### 44. Assign Panel to Project
**POST** `/admin/panels/assign`

**Request Body:**
```json
{
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### 45. Auto Assign Panels to Projects
**POST** `/admin/panels/auto-assign`

**Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

### Requests Management

#### 46. Get All Requests
**GET** `/admin/requests`

**Query Params (optional):**
- `status` (pending, approved, rejected)
- `requestType`
- `academicYear`

#### 47. Update Request Status
**PUT** `/admin/requests/:id/status`

**Request Body:**
```json
{
  "status": "approved",
  "adminNotes": "Request approved for valid reasons"
}
```

### Broadcast Messages

#### 48. Get Broadcast Messages
**GET** `/admin/broadcasts`

**Query Params (optional):**
- `active` (true/false)

#### 49. Create Broadcast Message
**POST** `/admin/broadcasts`

**Request Body:**
```json
{
  "message": "System maintenance scheduled for tomorrow",
  "expiresAt": "2025-12-25T23:59:59.000Z",
  "targetAudience": ["admin", "faculty", "student"],
  "school": "School of Engineering",
  "department": "Computer Science"
}
```

#### 50. Update Broadcast Message
**PUT** `/admin/broadcasts/:id`

**Request Body:**
```json
{
  "message": "System maintenance rescheduled",
  "expiresAt": "2025-12-26T23:59:59.000Z"
}
```

#### 51. Delete Broadcast Message
**DELETE** `/admin/broadcasts/:id`

### Reports

#### 52. Get Overview Report
**GET** `/admin/reports/overview`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 53. Get Projects Report
**GET** `/admin/reports/projects`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 54. Get Marks Report
**GET** `/admin/reports/marks`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 55. Get Faculty Workload Report
**GET** `/admin/reports/faculty-workload`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

#### 56. Get Student Performance Report
**GET** `/admin/reports/student-performance`

**Query Params:**
- `academicYear` (required)
- `school` (required)
- `department` (required)

---

## Project Coordinator Routes

> **Base Path:** `/project-coordinator`  
> **Auth Required:** Yes (Role: faculty with isProjectCoordinator=true)

### Profile & Permissions

#### 1. Get Profile
**GET** `/project-coordinator/profile`

#### 2. Get Permissions
**GET** `/project-coordinator/permissions`

**Response:**
```json
{
  "success": true,
  "data": {
    "canCreateFaculty": true,
    "canEditFaculty": true,
    "canDeleteFaculty": false,
    "canUploadStudents": true,
    "canModifyStudents": true,
    "canDeleteStudents": false,
    "canCreateProjects": true,
    "canEditProjects": true,
    "canDeleteProjects": false,
    "canAssignGuides": true,
    "canReassignGuides": true,
    "canCreatePanels": true,
    "canEditPanels": true,
    "canDeletePanels": false,
    "canAssignPanels": true,
    "canReassignPanels": true,
    "canMergeTeams": true,
    "canSplitTeams": true,
    "canEditMarkingSchema": false,
    "canManageRequests": true,
    "canCreateBroadcasts": true,
    "canEditBroadcasts": true,
    "canDeleteBroadcasts": true
  }
}
```

### Faculty Management

#### 3. Get Faculty List
**GET** `/project-coordinator/faculty`

#### 4. Create Faculty
**POST** `/project-coordinator/faculty`

**Request Body:**
```json
{
  "name": "Dr. Sarah Wilson",
  "emailId": "sarah.wilson@example.com",
  "employeeId": "FAC010",
  "password": "password123",
  "role": "faculty",
  "specialization": "Artificial Intelligence"
}
```

#### 5. Update Faculty
**PUT** `/project-coordinator/faculty/:employeeId`

**Request Body:**
```json
{
  "name": "Dr. Sarah Wilson Updated",
  "specialization": "AI & Robotics"
}
```

#### 6. Delete Faculty
**DELETE** `/project-coordinator/faculty/:employeeId`

### Student Management

#### 7. Get Student List
**GET** `/project-coordinator/students`

#### 8. Create Student
**POST** `/project-coordinator/student`

**Request Body:**
```json
{
  "regNo": "20242001",
  "name": "Charlie Brown",
  "emailId": "charlie@example.com"
}
```

#### 9. Upload Students (Bulk)
**POST** `/project-coordinator/student/bulk`

**Request Body:**
```json
{
  "students": [
    {
      "regNo": "20242001",
      "name": "Charlie Brown",
      "emailId": "charlie@example.com",
      "PAT": false
    },
    {
      "regNo": "20242002",
      "name": "Diana Prince",
      "emailId": "diana@example.com",
      "PAT": false
    }
  ]
}
```

#### 10. Update Student
**PUT** `/project-coordinator/student/:regNo`

**Request Body:**
```json
{
  "name": "Charlie Brown Updated",
  "PAT": true
}
```

#### 11. Delete Student
**DELETE** `/project-coordinator/student/:regNo`

#### 12. Get Student by Reg No
**GET** `/project-coordinator/student/:regNo`

### Project Management

#### 13. Get Project List
**GET** `/project-coordinator/projects`

#### 14. Create Projects (Bulk)
**POST** `/project-coordinator/projects/bulk`

**Request Body:**
```json
{
  "projects": [
    {
      "name": "AI Chatbot",
      "students": ["20242001", "20242002"],
      "guideFacultyEmpId": "FAC001",
      "specialization": "Artificial Intelligence",
      "type": "Development"
    },
    {
      "name": "E-Commerce Platform",
      "students": ["20242003", "20242004"],
      "guideFacultyEmpId": "FAC002",
      "specialization": "Web Development",
      "type": "Development"
    }
  ]
}
```

#### 15. Create Project
**POST** `/project-coordinator/projects`

**Request Body:**
```json
{
  "name": "IoT Home Automation",
  "students": ["20242005", "20242006", "20242007"],
  "guideFacultyEmpId": "FAC003",
  "specialization": "IoT",
  "type": "Development"
}
```

#### 16. Update Project
**PUT** `/project-coordinator/projects/:id`

**Request Body:**
```json
{
  "name": "IoT Smart Home Automation",
  "type": "Research & Development"
}
```

#### 17. Delete Project
**DELETE** `/project-coordinator/projects/:id`

### Guide Assignment

#### 18. Assign Guide
**PUT** `/project-coordinator/projects/:projectId/assign-guide`

**Request Body:**
```json
{
  "guideFacultyEmpId": "FAC005"
}
```

#### 19. Reassign Guide
**PUT** `/project-coordinator/projects/:projectId/reassign-guide`

**Request Body:**
```json
{
  "newGuideFacultyEmpId": "FAC006",
  "reason": "Previous guide on sabbatical"
}
```

### Panel Management

#### 20. Get Panel List
**GET** `/project-coordinator/panels`

#### 21. Create Panel
**POST** `/project-coordinator/panels`

**Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC003"]
}
```

#### 22. Auto Create Panels
**POST** `/project-coordinator/panels/auto-create`

#### 23. Update Panel Members
**PUT** `/project-coordinator/panels/:id/members`

**Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC004"]
}
```

#### 24. Delete Panel
**DELETE** `/project-coordinator/panels/:id`

### Panel Assignment

#### 25. Assign Panel to Project
**POST** `/project-coordinator/projects/assign-panel`

**Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### 26. Assign Review Panel
**POST** `/project-coordinator/projects/assign-review-panel`

**Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### 27. Auto Assign Panels
**POST** `/project-coordinator/panels/auto-assign`

#### 28. Reassign Panel
**PUT** `/project-coordinator/projects/reassign-panel`

**Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "reason": "Panel member unavailable"
}
```

### Team Operations

#### 29. Merge Teams
**POST** `/project-coordinator/teams/merge`

**Request Body:**
```json
{
  "projectId1": "64f8a1b2c3d4e5f6a7b8c9d0",
  "projectId2": "64f8a1b2c3d4e5f6a7b8c9d1",
  "reason": "Both teams working on similar topics"
}
```

#### 30. Split Team
**POST** `/project-coordinator/teams/split`

**Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "studentIds": ["20242001", "20242002"],
  "reason": "Team conflicts"
}
```

### Marking Schema & Component Library

#### 31. Get Marking Schema
**GET** `/project-coordinator/marking-schema`

#### 32. Update Marking Schema Deadlines
**PUT** `/project-coordinator/marking-schema/:id/deadlines`

**Request Body:**
```json
{
  "reviews": [
    {
      "reviewType": "Review 1",
      "deadline": "2025-04-15T23:59:59.000Z"
    }
  ]
}
```

#### 33. Get Component Library
**GET** `/project-coordinator/component-library`

### Request Management

#### 34. Get Requests
**GET** `/project-coordinator/requests`

#### 35. Handle Request
**PUT** `/project-coordinator/requests/:id/status`

**Request Body:**
```json
{
  "status": "approved",
  "coordinatorNotes": "Approved as requested"
}
```

### Broadcast Messages

#### 36. Get Broadcasts
**GET** `/project-coordinator/broadcasts`

#### 37. Create Broadcast
**POST** `/project-coordinator/broadcasts`

**Request Body:**
```json
{
  "message": "Review 1 deadline extended by 2 days",
  "expiresAt": "2025-04-20T23:59:59.000Z",
  "targetAudience": ["faculty", "student"]
}
```

#### 38. Update Broadcast
**PUT** `/project-coordinator/broadcasts/:id`

#### 39. Delete Broadcast
**DELETE** `/project-coordinator/broadcasts/:id`

### Reports

#### 40. Get Overview Report
**GET** `/project-coordinator/reports/overview`

#### 41. Get Projects Report
**GET** `/project-coordinator/reports/projects`

#### 42. Get Marks Report
**GET** `/project-coordinator/reports/marks`

#### 43. Get Panels Report
**GET** `/project-coordinator/reports/panels`

#### 44. Get Faculty Workload Report
**GET** `/project-coordinator/reports/faculty-workload`

#### 45. Get Student Performance Report
**GET** `/project-coordinator/reports/student-performance`

### Department Configuration

#### 46. Get Department Config
**GET** `/project-coordinator/department-config`

---

## Faculty Routes

> **Base Path:** `/faculty`  
> **Auth Required:** Yes (Role: faculty)

### Profile

#### 1. Get Profile
**GET** `/faculty/profile`

#### 2. Update Profile
**PUT** `/faculty/profile`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "specialization": "Deep Learning"
}
```

### Projects

#### 3. Get Assigned Projects
**GET** `/faculty/projects`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "AI Chatbot",
      "students": [
        {
          "regNo": "20242001",
          "name": "Charlie Brown",
          "emailId": "charlie@example.com"
        }
      ],
      "guideFaculty": "FAC001",
      "specialization": "AI",
      "type": "Development",
      "school": "School of Engineering",
      "department": "Computer Science",
      "academicYear": "2024-2025"
    }
  ]
}
```

#### 4. Get Project Details
**GET** `/faculty/projects/:id`

### Students

#### 5. Get Assigned Students
**GET** `/faculty/students`

### Marking Schema

#### 6. Get Marking Schema
**GET** `/faculty/marking-schema`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "academicYear": "2024-2025",
    "school": "School of Engineering",
    "department": "Computer Science",
    "reviews": [
      {
        "reviewType": "Review 1",
        "deadline": "2025-03-15T23:59:59.000Z",
        "components": [
          {
            "componentId": "64f8a1b2c3d4e5f6a7b8c9d1",
            "name": "Documentation",
            "maxMarks": 20
          }
        ]
      }
    ]
  }
}
```

### Marks

#### 7. Submit Marks
**POST** `/faculty/marks`

**Request Body:**
```json
{
  "student": "64f8a1b2c3d4e5f6a7b8c9d0",
  "project": "64f8a1b2c3d4e5f6a7b8c9d1",
  "reviewType": "Review 1",
  "componentMarks": [
    {
      "componentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "marksObtained": 18
    },
    {
      "componentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "marksObtained": 14
    }
  ],
  "totalMarks": 32,
  "maxTotalMarks": 35,
  "remarks": "Good work, needs improvement in presentation"
}
```

#### 8. Update Marks
**PUT** `/faculty/marks/:id`

**Request Body:**
```json
{
  "componentMarks": [
    {
      "componentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "marksObtained": 19
    }
  ],
  "totalMarks": 33,
  "remarks": "Updated after re-evaluation"
}
```

#### 9. Get Submitted Marks
**GET** `/faculty/marks`

**Query Params (optional):**
- `reviewType`
- `project`
- `student`

### Approvals

#### 10. Approve PPT
**POST** `/faculty/approvals/ppt`

**Request Body:**
```json
{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1"
}
```

#### 11. Approve Draft
**POST** `/faculty/approvals/draft`

**Request Body:**
```json
{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1"
}
```

### Requests

#### 12. Create Request
**POST** `/faculty/requests`

**Request Body:**
```json
{
  "student": "64f8a1b2c3d4e5f6a7b8c9d0",
  "project": "64f8a1b2c3d4e5f6a7b8c9d1",
  "reviewType": "Review 1",
  "requestType": "unlock_marks",
  "reason": "Need to update marks due to recalculation"
}
```

### Panels

#### 13. Get Assigned Panels
**GET** `/faculty/panels`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "members": ["FAC001", "FAC002", "FAC003"],
      "school": "School of Engineering",
      "department": "Computer Science",
      "academicYear": "2024-2025",
      "projects": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "AI Chatbot"
        }
      ]
    }
  ]
}
```

### Broadcasts

#### 14. Get Broadcasts
**GET** `/faculty/broadcasts`

---

## Student Routes

> **Base Path:** `/student`  
> **Auth Required:** Varies (see individual endpoints)

### Profile

#### 1. Get Student Profile
**GET** `/student/profile/:regNo`

**Auth:** Not Required

**Response:**
```json
{
  "success": true,
  "data": {
    "regNo": "20242001",
    "name": "Charlie Brown",
    "emailId": "charlie@example.com",
    "PAT": false,
    "school": "School of Engineering",
    "department": "Computer Science",
    "academicYear": "2024-2025",
    "isActive": true
  }
}
```

### Project

#### 2. Get Student Project
**GET** `/student/project/:regNo`

**Auth:** Not Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "AI Chatbot",
    "students": ["20242001", "20242002"],
    "guideFaculty": {
      "employeeId": "FAC001",
      "name": "Dr. John Smith",
      "emailId": "john.smith@example.com"
    },
    "panel": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "members": [
        {
          "employeeId": "FAC002",
          "name": "Dr. Jane Doe"
        }
      ]
    },
    "specialization": "Artificial Intelligence",
    "type": "Development"
  }
}
```

### Marks

#### 3. Get Student Marks
**GET** `/student/marks/:regNo`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "guideMarks": [
      {
        "reviewType": "Review 1",
        "componentMarks": [
          {
            "componentName": "Documentation",
            "marksObtained": 18,
            "maxMarks": 20
          }
        ],
        "totalMarks": 32,
        "maxTotalMarks": 35,
        "remarks": "Good work"
      }
    ],
    "panelMarks": [
      {
        "reviewType": "Review 1",
        "componentMarks": [
          {
            "componentName": "Presentation",
            "marksObtained": 14,
            "maxMarks": 15
          }
        ],
        "totalMarks": 28,
        "maxTotalMarks": 30
      }
    ]
  }
}
```

### Approvals

#### 4. Get Student Approvals
**GET** `/student/approvals/:regNo`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "Review 1": {
      "ppt": {
        "approved": true,
        "locked": true,
        "approvedAt": "2025-03-10T10:30:00.000Z"
      },
      "draft": {
        "approved": true,
        "locked": false,
        "approvedAt": "2025-03-12T14:20:00.000Z"
      }
    },
    "Review 2": {
      "ppt": {
        "approved": false,
        "locked": false
      },
      "draft": {
        "approved": false,
        "locked": false
      }
    }
  }
}
```

### Broadcasts

#### 5. Get Broadcasts
**GET** `/student/broadcasts`

**Auth:** Not Required

---

## Project Routes

> **Base Path:** `/projects`  
> **Auth Required:** Yes

### List & Retrieve

#### 1. Get Project List
**GET** `/projects/list`

**Query Params (optional):**
- `academicYear`
- `school`
- `department`
- `specialization`
- `type`
- `guideFaculty`
- `panel`

#### 2. Get Project by ID
**GET** `/projects/:id`

#### 3. Get Projects by Student Reg No
**GET** `/projects/student/:regNo`

#### 4. Get Projects by Guide Faculty
**GET** `/projects/guide/:employeeId`

#### 5. Get Projects by Panel
**GET** `/projects/panel/:panelId`

### Create

#### 6. Create Project
**POST** `/projects/create`

**Request Body:**
```json
{
  "name": "Blockchain Voting System",
  "students": ["20242008", "20242009"],
  "guideFacultyEmpId": "FAC004",
  "specialization": "Blockchain",
  "type": "Research"
}
```

#### 7. Create Projects (Bulk)
**POST** `/projects/bulk`

**Request Body:**
```json
{
  "school": "School of Engineering",
  "department": "Computer Science",
  "projects": [
    {
      "name": "Cloud Storage System",
      "students": ["20242010", "20242011"],
      "specialization": "Cloud Computing",
      "type": "Development"
    },
    {
      "name": "Network Security Tool",
      "students": ["20242012"],
      "specialization": "Cybersecurity",
      "type": "Development"
    }
  ],
  "guideFacultyEmpId": "FAC005"
}
```

### Update & Delete

#### 8. Update Project
**PUT** `/projects/:id`

**Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Advanced Blockchain Voting System",
  "type": "Research & Development"
}
```

#### 9. Delete Project
**DELETE** `/projects/:id`

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message description",
  "error": "Detailed error information"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 5,
    "totalItems": 234
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry or constraint violation |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

## Authentication Headers

For all authenticated endpoints, include the JWT token in the header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Notes

1. **Date Format:** All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
2. **ObjectID Format:** MongoDB ObjectIds are 24-character hexadecimal strings
3. **Query Parameters:** All query parameters are optional unless specified as "required"
4. **Pagination:** Default page=1, limit=50 for paginated endpoints
5. **Feature Locks:** Some operations may be blocked if feature locks are enabled in department config
6. **Broadcast Block:** Faculty operations may be blocked during active broadcast periods

---

## Common Data Models

### Faculty
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Dr. John Smith",
  "emailId": "john.smith@example.com",
  "employeeId": "FAC001",
  "role": "faculty",
  "school": "School of Engineering",
  "department": "Computer Science",
  "specialization": "Machine Learning",
  "phoneNumber": "+1234567890",
  "isProjectCoordinator": false,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Student
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "regNo": "20242001",
  "name": "Charlie Brown",
  "emailId": "charlie@example.com",
  "PAT": false,
  "school": "School of Engineering",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "isActive": true,
  "approvals": {},
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Project
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "AI Chatbot",
  "students": ["20242001", "20242002"],
  "guideFaculty": "64f8a1b2c3d4e5f6a7b8c9d1",
  "panel": "64f8a1b2c3d4e5f6a7b8c9d2",
  "specialization": "Artificial Intelligence",
  "type": "Development",
  "school": "School of Engineering",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "isBestProject": false,
  "isActive": true,
  "reviewPanelAssignments": [],
  "history": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Panel
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "members": [
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2",
    "64f8a1b2c3d4e5f6a7b8c9d3"
  ],
  "school": "School of Engineering",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Marks
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "student": "64f8a1b2c3d4e5f6a7b8c9d1",
  "project": "64f8a1b2c3d4e5f6a7b8c9d2",
  "evaluator": "64f8a1b2c3d4e5f6a7b8c9d3",
  "evaluatorType": "guide",
  "reviewType": "Review 1",
  "componentMarks": [
    {
      "componentId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "marksObtained": 18
    }
  ],
  "totalMarks": 32,
  "maxTotalMarks": 35,
  "remarks": "Good work",
  "isLocked": false,
  "school": "School of Engineering",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Frontend Integration Tips

1. **Store Token:** Save JWT token in localStorage or sessionStorage after login
2. **Axios Interceptor:** Set up interceptor to automatically add Bearer token to requests
3. **Error Handling:** Create centralized error handler for common error codes
4. **Loading States:** Show loading indicators during API calls
5. **Optimistic Updates:** Update UI optimistically for better UX
6. **Cache Data:** Use React Query or similar for caching and automatic refetching
7. **Form Validation:** Validate on frontend before sending to reduce API calls

### Example Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

**Last Updated:** December 19, 2025  
**Version:** 1.0
