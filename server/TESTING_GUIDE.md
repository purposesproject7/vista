# Testing Guide - Vista Project Management System

This document provides comprehensive testing scenarios for the implemented features.

## Table of Contents
1. [Project Creation with Student Validation](#project-creation-with-student-validation)
2. [Panel Auto-Assignment (Primary Coordinator Only)](#panel-auto-assignment)
3. [Panel Reassignment](#panel-reassignment)
4. [Review Panel Assignment with Temporary Panels](#review-panel-assignment)

---

## Prerequisites

### Setup Test Data

1. **Create Test Students** (via `/api/project-coordinator/student/bulk`):
```json
{
  "students": [
    { "regNo": "STU001", "name": "Alice Smith", "emailId": "alice@example.com" },
    { "regNo": "STU002", "name": "Bob Johnson", "emailId": "bob@example.com" },
    { "regNo": "STU003", "name": "Carol White", "emailId": "carol@example.com" },
    { "regNo": "STU004", "name": "David Brown", "emailId": "david@example.com" }
  ]
}
```

2. **Create Test Faculty** (via `/api/project-coordinator/faculty`):
```json
[
  {
    "name": "Dr. John Doe",
    "emailId": "john@example.com",
    "employeeId": "FAC001",
    "password": "pass123",
    "role": "faculty",
    "specialization": "Web Development"
  },
  {
    "name": "Dr. Jane Smith",
    "emailId": "jane@example.com",
    "employeeId": "FAC002",
    "password": "pass123",
    "role": "faculty",
    "specialization": "Machine Learning"
  },
  {
    "name": "Dr. Mark Wilson",
    "emailId": "mark@example.com",
    "employeeId": "FAC003",
    "password": "pass123",
    "role": "faculty",
    "specialization": "Web Development"
  }
]
```

---

## 1. Project Creation with Student Validation

### Test Case 1.1: Create Project with Valid Students ✓

**Endpoint:** `POST /api/project-coordinator/projects`

**Request:**
```json
{
  "name": "E-Commerce Platform",
  "students": ["STU001", "STU002"],
  "guideFacultyEmpId": "FAC001",
  "specialization": "Web Development",
  "type": "software"
}
```

**Expected Result:**
- Status: 201
- Project created successfully
- Students are assigned to the project

### Test Case 1.2: Create Project with Invalid Student (Should Fail) ✗

**Endpoint:** `POST /api/project-coordinator/projects`

**Request:**
```json
{
  "name": "Mobile App",
  "students": ["STU001", "STU999"],
  "guideFacultyEmpId": "FAC001",
  "specialization": "Web Development",
  "type": "software"
}
```

**Expected Result:**
- Status: 400
- Error message: "Student with Reg No STU999 not found."

### Test Case 1.3: Create Project with Student Already Assigned (Should Fail) ✗

**Prerequisites:**
- Create a project with STU001 first (as in Test Case 1.1)

**Request:**
```json
{
  "name": "Another Project",
  "students": ["STU001", "STU003"],
  "guideFacultyEmpId": "FAC001",
  "specialization": "Web Development",
  "type": "software"
}
```

**Expected Result:**
- Status: 400
- Error message: "Student STU001 is already assigned to project 'E-Commerce Platform'."

---

## 2. Panel Auto-Assignment

### Test Case 2.1: Auto-Assign Panels as Primary Coordinator ✓

**Prerequisites:**
- Login as PRIMARY coordinator
- Create panels first using `/api/project-coordinator/panels/auto-create`
- Create some projects without panel assignments

**Endpoint:** `POST /api/project-coordinator/panels/auto-assign`

**Request:**
```json
{
  "buffer": 0
}
```

**Expected Result:**
- Status: 200
- Message indicates number of projects assigned
- Projects are assigned to panels based on specialization
- Load balancing is applied

### Test Case 2.2: Auto-Assign Panels as Non-Primary Coordinator (Should Fail) ✗

**Prerequisites:**
- Login as NON-PRIMARY coordinator

**Endpoint:** `POST /api/project-coordinator/panels/auto-assign`

**Request:**
```json
{
  "buffer": 0
}
```

**Expected Result:**
- Status: 403
- Error message: "Only primary coordinator can auto-assign panels."

### Test Case 2.3: Auto-Assign with Buffer Parameter ✓

**Prerequisites:**
- Login as PRIMARY coordinator
- Have multiple panels created

**Request:**
```json
{
  "buffer": 2
}
```

**Expected Result:**
- Status: 200
- The 2 most experienced panels (lowest employee IDs) are excluded from auto-assignment
- Remaining panels receive assignments

---

## 3. Panel Reassignment

### Test Case 3.1: Reassign to Existing Panel ✓

**Prerequisites:**
- Have a project with an assigned panel
- Have another available panel

**Endpoint:** `PUT /api/project-coordinator/projects/reassign-panel`

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d9",
  "reason": "Original panel unavailable due to scheduling conflict"
}
```

**Expected Result:**
- Status: 200
- Message: "Panel reassigned successfully."
- Project history updated with reassignment action
- Old panel's count decremented
- New panel's count incremented

### Test Case 3.2: Reassign with New Temporary Panel (Change Faculty) ✓

**Prerequisites:**
- Have a project with an assigned panel

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "memberEmployeeIds": ["FAC002", "FAC003"],
  "reason": "Need faculty with specific expertise for this project"
}
```

**Expected Result:**
- Status: 200
- Message: "Panel reassigned successfully."
- New temporary panel created with specified faculty
- Project assigned to the new temporary panel
- Old panel's count decremented

### Test Case 3.3: Reassign without Reason (Should Fail) ✗

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d9"
}
```

**Expected Result:**
- Status: 400
- Error message: "Reason is required."

---

## 4. Review Panel Assignment with Temporary Panels

### Test Case 4.1: Assign Existing Panel for Review ✓

**Prerequisites:**
- Have a project created
- Have panels available
- Have valid review types configured in marking schema

**Endpoint:** `POST /api/project-coordinator/projects/assign-review-panel`

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d8"
}
```

**Expected Result:**
- Status: 200
- Message: "Panel assigned to Review 1 successfully."
- Review panel added to project's reviewPanels array
- No specialization validation enforced

### Test Case 4.2: Create Temporary Panel for Review ✓

**Prerequisites:**
- Have a project created
- Have faculty available

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 2",
  "memberEmployeeIds": ["FAC001", "FAC003"]
}
```

**Expected Result:**
- Status: 200
- Message: "Panel assigned to Review 2 successfully."
- New temporary panel created with type="temporary"
- Temporary panel has empty specializations array
- Review panel added to project's reviewPanels array
- Panel stored in database as permanent record

### Test Case 4.3: Assign Review Panel with Invalid Review Type (Should Fail) ✗

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Invalid Review",
  "panelId": "64f8a1b2c3d4e5f6a7b8c9d8"
}
```

**Expected Result:**
- Status: 400
- Error message: "Invalid review type: Invalid Review"
- Response includes list of valid review types

### Test Case 4.4: Update Existing Review Panel Assignment ✓

**Prerequisites:**
- Have a project with an existing review panel assignment

**Request:**
```json
{
  "projectId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "reviewType": "Review 1",
  "memberEmployeeIds": ["FAC002", "FAC003"]
}
```

**Expected Result:**
- Status: 200
- New temporary panel created
- Existing review panel assignment updated with new panel
- Previous panel reference preserved in project history

---

## Validation Summary

### Student Validation in Project Creation
- ✓ Validates student exists in database before assignment
- ✓ Checks if student is already assigned to another active project
- ✓ Provides clear error messages for validation failures

### Specialization-Based Panel Assignment
- ✓ Auto-assign considers panel specializations
- ✓ Fallback to all panels if no specialization match
- ✓ Load balancing prioritizes panels with fewer assignments

### Primary Coordinator Permission for Auto-Assign
- ✓ Only primary coordinators can call auto-assign endpoint
- ✓ Non-primary coordinators receive 403 error
- ✓ Permission check happens before any processing

### Temporary Panel Creation
- ✓ Temporary panels created with type="temporary"
- ✓ No specialization validation for temporary panels
- ✓ Temporary panels stored permanently in database
- ✓ Can be used for both review panels and reassignments

### Panel Reassignment Functionality
- ✓ Supports reassignment to existing panel
- ✓ Supports creation of temporary panel with new faculty
- ✓ Requires reason for all reassignments
- ✓ Updates project history with reassignment details
- ✓ Properly manages panel assignment counts

---

## Testing Tools

### Recommended Tools:
1. **Postman** - For API testing with collections
2. **cURL** - For command-line testing
3. **Thunder Client** (VS Code Extension) - For in-editor testing

### Example cURL Command:
```bash
curl -X POST http://localhost:5000/api/project-coordinator/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "students": ["STU001", "STU002"],
    "guideFacultyEmpId": "FAC001",
    "specialization": "Web Development",
    "type": "software"
  }'
```

---

## Notes

1. **Temporary Panels**: All panels, including temporary ones, are stored permanently in the database. The `type` field distinguishes between "regular" and "temporary" panels.

2. **Specialization Validation**: 
   - Enforced for auto-assignment
   - Skipped for manual review panel assignment
   - Skipped for temporary panel creation

3. **Permission Hierarchy**:
   - Primary coordinators have full access
   - Non-primary coordinators have limited permissions
   - Auto-assign is restricted to primary coordinators only

4. **Panel Assignment Counts**:
   - Automatically managed by the system
   - Incremented on assignment
   - Decremented on reassignment
   - Used for load balancing in auto-assignment

