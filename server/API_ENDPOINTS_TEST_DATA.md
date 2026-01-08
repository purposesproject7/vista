# API Endpoints for Creating/Updating Data

This document lists all server endpoints used for creating or updating data, along with dummy request data for testing.

## Admin Routes (`/api/admin`)

### Master Data

#### 1. Bulk Create Master Data
- **Method:** `POST`
- **Endpoint:** `/api/admin/master-data/bulk`
- **Description:** Create schools, departments, and academic years in bulk.
- **Request Body:**
```json
{
  "schools": [
    { "name": "School of Engineering", "code": "SOE" },
    { "name": "School of Business", "code": "SOB" }
  ],
  "departments": [
    { "name": "Computer Science", "code": "CSE", "schoolCode": "SOE" },
    { "name": "Mechanical Engineering", "code": "ME", "schoolCode": "SOE" }
  ],
  "academicYears": [
    { "year": "2024-2025" },
    { "year": "2025-2026" }
  ]
}
```

#### 2. Create School
- **Method:** `POST`
- **Endpoint:** `/api/admin/master-data/schools`
- **Description:** Create a single school.
- **Request Body:**
```json
{
  "name": "School of Law",
  "code": "SOL"
}
```

#### 3. Update School
- **Method:** `PUT`
- **Endpoint:** `/api/admin/master-data/schools/:id`
- **Description:** Update an existing school.
- **Request Body:**
```json
{
  "name": "School of Law & Governance",
  "code": "SOLG"
}
```

#### 4. Create Department
- **Method:** `POST`
- **Endpoint:** `/api/admin/master-data/departments`
- **Description:** Create a single department.
- **Request Body:**
```json
{
  "name": "Civil Engineering",
  "code": "CE",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0" 
}
```

#### 5. Update Department
- **Method:** `PUT`
- **Endpoint:** `/api/admin/master-data/departments/:id`
- **Description:** Update an existing department.
- **Request Body:**
```json
{
  "name": "Civil & Environmental Engineering",
  "code": "CEE"
}
```

#### 6. Create Academic Year
- **Method:** `POST`
- **Endpoint:** `/api/admin/master-data/academic-years`
- **Description:** Create a new academic year.
- **Request Body:**
```json
{
  "year": "2026-2027"
}
```

### Department Configuration

#### 7. Create Department Config
- **Method:** `POST`
- **Endpoint:** `/api/admin/department-config`
- **Description:** Create configuration for a department for a specific year.
- **Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "stages": ["Review 1", "Review 2", "Final Review"]
}
```

#### 8. Update Department Config
- **Method:** `PUT`
- **Endpoint:** `/api/admin/department-config/:id`
- **Description:** Update department configuration.
- **Request Body:**
```json
{
  "stages": ["Review 1", "Mid-Term", "Final Review"]
}
```

#### 9. Update Feature Lock
- **Method:** `PATCH`
- **Endpoint:** `/api/admin/department-config/:id/feature-lock`
- **Description:** Lock or unlock specific features.
- **Request Body:**
```json
{
  "feature": "grading",
  "isLocked": true
}
```

### Component Library

#### 10. Create Component Library
- **Method:** `POST`
- **Endpoint:** `/api/admin/component-library`
- **Description:** Define assessment components for a department.
- **Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "components": [
    { "name": "Presentation", "weightage": 0.4 },
    { "name": "Report", "weightage": 0.6 }
  ]
}
```

#### 11. Update Component Library
- **Method:** `PUT`
- **Endpoint:** `/api/admin/component-library/:id`
- **Description:** Update assessment components.
- **Request Body:**
```json
{
  "components": [
    { "name": "Presentation", "weightage": 0.3 },
    { "name": "Report", "weightage": 0.5 },
    { "name": "Viva", "weightage": 0.2 }
  ]
}
```

### Marking Schema

#### 12. Create/Update Marking Schema
- **Method:** `POST`
- **Endpoint:** `/api/admin/marking-schema`
- **Description:** Define how marks are distributed across reviews.
- **Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "reviews": [
    { "name": "Review 1", "totalMarks": 50 },
    { "name": "Review 2", "totalMarks": 50 }
  ]
}
```

#### 13. Update Marking Schema
- **Method:** `PUT`
- **Endpoint:** `/api/admin/marking-schema/:id`
- **Description:** Update an existing marking schema.
- **Request Body:**
```json
{
  "reviews": [
    { "name": "Review 1", "totalMarks": 40 },
    { "name": "Review 2", "totalMarks": 60 }
  ]
}
```

### Faculty Management

#### 14. Create Faculty
- **Method:** `POST`
- **Endpoint:** `/api/admin/faculty`
- **Description:** Create a new faculty member.
- **Request Body:**
```json
{
  "name": "Dr. Alice Smith",
  "emailId": "alice.smith@university.edu",
  "employeeId": "FAC001",
  "password": "SecurePassword123",
  "role": "faculty",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

#### 15. Bulk Create Faculty
- **Method:** `POST`
- **Endpoint:** `/api/admin/faculty/bulk`
- **Description:** Create multiple faculty members.
- **Request Body:**
```json
{
  "facultyList": [
    {
      "name": "Dr. Bob Jones",
      "emailId": "bob.jones@university.edu",
      "employeeId": "FAC002",
      "password": "password123",
      "role": "faculty",
      "school": "64f8a1b2c3d4e5f6a7b8c9d0",
      "department": "64f8a1b2c3d4e5f6a7b8c9d2"
    }
  ]
}
```

#### 16. Create Admin
- **Method:** `POST`
- **Endpoint:** `/api/admin/faculty/admin`
- **Description:** Create a new admin user.
- **Request Body:**
```json
{
  "name": "Super Admin",
  "emailId": "admin@university.edu",
  "employeeId": "ADM001",
  "password": "AdminPassword123"
}
```

#### 17. Update Faculty
- **Method:** `PUT`
- **Endpoint:** `/api/admin/faculty/:employeeId`
- **Description:** Update faculty details.
- **Request Body:**
```json
{
  "name": "Dr. Alice Johnson",
  "emailId": "alice.johnson@university.edu"
}
```

### Project Coordinators

#### 18. Assign Project Coordinator
- **Method:** `POST`
- **Endpoint:** `/api/admin/project-coordinators`
- **Description:** Assign a faculty as a project coordinator.
- **Request Body:**
```json
{
  "facultyId": "64f8a1b2c3d4e5f6a7b8c9d5",
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

#### 19. Update Project Coordinator
- **Method:** `PUT`
- **Endpoint:** `/api/admin/project-coordinators/:id`
- **Description:** Update coordinator details.
- **Request Body:**
```json
{
  "isPrimary": true
}
```

#### 20. Update Coordinator Permissions
- **Method:** `PATCH`
- **Endpoint:** `/api/admin/project-coordinators/:id/permissions`
- **Description:** Update permissions for a coordinator.
- **Request Body:**
```json
{
  "permissions": {
    "canCreateFaculty": true,
    "canDeleteFaculty": false
  }
}
```

### Student Management

#### 21. Create Student
- **Method:** `POST`
- **Endpoint:** `/api/admin/student`
- **Description:** Create a new student.
- **Request Body:**
```json
{
  "regNo": "REG2024001",
  "name": "John Student",
  "emailId": "john.student@university.edu",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### 22. Bulk Upload Students
- **Method:** `POST`
- **Endpoint:** `/api/admin/student/bulk`
- **Description:** Create multiple students.
- **Request Body:**
```json
{
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "students": [
    { "regNo": "REG2024002", "name": "Jane Student", "emailId": "jane@university.edu" }
  ]
}
```

#### 23. Update Student
- **Method:** `PUT`
- **Endpoint:** `/api/admin/student/:regNo`
- **Description:** Update student details.
- **Request Body:**
```json
{
  "name": "John A. Student"
}
```

---

## Auth Routes (`/api/auth`)

#### 24. Register
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Description:** Register a new user (usually for initial setup or self-registration if enabled).
- **Request Body:**
```json
{
  "name": "New Faculty",
  "emailId": "new.faculty@university.edu",
  "password": "password123",
  "employeeId": "FAC003",
  "role": "faculty"
}
```

#### 25. Forgot Password - Send OTP
- **Method:** `POST`
- **Endpoint:** `/api/auth/forgot-password/send-otp`
- **Description:** Send OTP for password reset.
- **Request Body:**
```json
{
  "emailId": "user@university.edu"
}
```

#### 26. Forgot Password - Verify OTP
- **Method:** `POST`
- **Endpoint:** `/api/auth/forgot-password/verify-otp`
- **Description:** Verify OTP and reset password.
- **Request Body:**
```json
{
  "emailId": "user@university.edu",
  "otp": "123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

#### 27. Change Password
- **Method:** `PUT`
- **Endpoint:** `/api/auth/change-password`
- **Description:** Change current user's password.
- **Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

---

## Faculty Routes (`/api/faculty`)

#### 28. Update Profile
- **Method:** `PUT`
- **Endpoint:** `/api/faculty/profile`
- **Description:** Update faculty profile information.
- **Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "bio": "Professor of Computer Science"
}
```

#### 29. Submit Marks
- **Method:** `POST`
- **Endpoint:** `/api/faculty/marks`
- **Description:** Submit marks for a student project review.
- **Request Body:**
```json
{
  "student": "64f8a1b2c3d4e5f6a7b8c9d6",
  "project": "64f8a1b2c3d4e5f6a7b8c9d7",
  "reviewType": "Review 1",
  "componentMarks": {
    "Presentation": 15,
    "Report": 20
  },
  "totalMarks": 35,
  "maxTotalMarks": 50
}
```

#### 30. Update Marks
- **Method:** `PUT`
- **Endpoint:** `/api/faculty/marks/:id`
- **Description:** Update previously submitted marks.
- **Request Body:**
```json
{
  "totalMarks": 38,
  "componentMarks": {
    "Presentation": 18,
    "Report": 20
  }
}
```

#### 31. Approve PPT
- **Method:** `POST`
- **Endpoint:** `/api/faculty/approvals/ppt`
- **Description:** Approve a student's PPT.
- **Request Body:**
```json
{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d6",
  "reviewType": "Review 1"
}
```

#### 32. Approve Draft
- **Method:** `POST`
- **Endpoint:** `/api/faculty/approvals/draft`
- **Description:** Approve a student's draft report.
- **Request Body:**
```json
{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d6",
  "reviewType": "Review 1"
}
```

#### 33. Create Request
- **Method:** `POST`
- **Endpoint:** `/api/faculty/requests`
- **Description:** Create a request (e.g., for extension).
- **Request Body:**
```json
{
  "student": "64f8a1b2c3d4e5f6a7b8c9d6",
  "project": "64f8a1b2c3d4e5f6a7b8c9d7",
  "reviewType": "Review 1",
  "requestType": "Extension",
  "reason": "Medical Emergency"
}
```

---

## Project Coordinator Routes (`/api/project-coordinator`)

#### 34. Create Faculty (Coordinator Context)
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/faculty`
- **Description:** Create faculty within the coordinator's department.
- **Request Body:**
```json
{
  "name": "Dr. New Faculty",
  "emailId": "new.fac@university.edu",
  "employeeId": "FAC004",
  "password": "password123",
  "role": "faculty",
  "specialization": "Data Science"
}
```

#### 35. Update Faculty (Coordinator Context)
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/faculty/:employeeId`
- **Description:** Update faculty details.
- **Request Body:**
```json
{
  "specialization": "Machine Learning"
}
```

#### 36. Create Student (Coordinator Context)
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/student`
- **Description:** Create student within the coordinator's department.
- **Request Body:**
```json
{
  "regNo": "REG2024003",
  "name": "Student Three",
  "emailId": "student3@university.edu"
}
```

#### 37. Bulk Upload Students (Coordinator Context)
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/student/bulk`
- **Description:** Bulk upload students.
- **Request Body:**
```json
{
  "students": [
    { "regNo": "REG2024004", "name": "Student Four", "emailId": "student4@university.edu" }
  ]
}
```

#### 38. Create Project
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/projects`
- **Description:** Create a new project.
- **Request Body:**
```json
{
  "name": "AI Research Project",
  "students": ["64f8a1b2c3d4e5f6a7b8c9d6"],
  "guideFacultyEmpId": "FAC001",
  "specialization": "AI",
  "type": "Research"
}
```

#### 39. Update Project
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/projects/:id`
- **Description:** Update project details.
- **Request Body:**
```json
{
  "name": "AI Research Project - Phase 2"
}
```

#### 40. Assign Guide
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/projects/:projectId/assign-guide`
- **Description:** Assign a guide to a project.
- **Request Body:**
```json
{
  "guideFacultyEmpId": "FAC002"
}
```

#### 41. Reassign Guide
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/projects/:projectId/reassign-guide`
- **Description:** Reassign a guide.
- **Request Body:**
```json
{
  "newGuideFacultyEmpId": "FAC003",
  "reason": "Faculty on leave"
}
```

#### 42. Create Panel
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/panels`
- **Description:** Create a review panel.
- **Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC003"]
}
```

#### 43. Auto Create Panels
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/panels/auto-create`
- **Description:** Automatically create panels based on criteria.
- **Request Body:**
```json
{
  "departments": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "academicYear": "64f8a1b2c3d4e5f6a7b8c9d1",
  "panelSize": 3
}
```

#### 44. Update Panel Members
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/panels/:id/members`
- **Description:** Update members of a panel.
- **Request Body:**
```json
{
  "memberEmployeeIds": ["FAC001", "FAC004", "FAC005"]
}
```

#### 45. Assign Panel to Project
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/projects/:projectId/assign-panel`
- **Description:** Assign a panel to a project.
- **Request Body:**
```json
{
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d8"
}
```

#### 46. Assign Review Panel
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/projects/assign-review-panel`
- **Description:** Assign a panel for a specific review. Can either use an existing panel or create a temporary panel with specific faculty members.
- **Request Body (Option 1 - Use existing panel):**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d8"
}
```
- **Request Body (Option 2 - Create temporary panel with specific faculty):**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1",
  "memberEmployeeIds": ["FAC001", "FAC002", "FAC003"]
}
```

#### 47. Reassign Panel
- **Method:** `PUT`
- **Endpoint:** `/api/project-coordinator/projects/reassign-panel`
- **Description:** Reassign a project to a different panel. Can either assign to an existing panel or create a temporary panel with new faculty members.
- **Request Body (Option 1 - Reassign to existing panel):**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d9",
  "reason": "Original panel unavailable due to scheduling conflict"
}
```
- **Request Body (Option 2 - Create temporary panel with new faculty):**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "memberEmployeeIds": ["FAC004", "FAC005"],
  "reason": "Need faculty with specific expertise for this project"
}
```

#### 48. Auto Assign Panels
- **Method:** `POST`
- **Endpoint:** `/api/project-coordinator/panels/auto-assign`
- **Description:** Automatically assign panels to projects based on specialization and workload. **Only primary coordinator can perform this action.**
- **Request Body:**
```json
{
  "buffer": 0
}
```
- **Note:** Buffer parameter is optional. It specifies how many of the most experienced panels to exclude from auto-assignment (default: 0).

---

## Project Routes (`/api/projects`)

#### 49. Create Project
- **Method:** `POST`
- **Endpoint:** `/api/projects/create`
- **Description:** Create a project (general route).
- **Request Body:**
```json
{
  "name": "Web Development Project",
  "students": ["64f8a1b2c3d4e5f6a7b8c9d6"],
  "guideFacultyEmpId": "FAC001",
  "specialization": "Web",
  "type": "Development"
}
```

#### 50. Bulk Create Projects
- **Method:** `POST`
- **Endpoint:** `/api/projects/bulk`
- **Description:** Create multiple projects.
- **Request Body:**
```json
{
  "school": "64f8a1b2c3d4e5f6a7b8c9d0",
  "department": "64f8a1b2c3d4e5f6a7b8c9d2",
  "guideFacultyEmpId": "FAC001",
  "projects": [
    { "name": "Project A", "students": ["student_id_1"] },
    { "name": "Project B", "students": ["student_id_2"] }
  ]
}
```

#### 49. Update Project Details
- **Method:** `PUT`
- **Endpoint:** `/api/projects/:id`
- **Description:** Update project and student details.
- **Request Body:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d7",
  "projectUpdates": {
    "name": "Updated Project Name"
  },
  "studentUpdates": [
    { "studentId": "64f8a1b2c3d4e5f6a7b8c9d6", "updates": { "name": "Updated Student Name" } }
  ]
}
```
