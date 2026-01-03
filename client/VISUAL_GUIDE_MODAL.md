# Student Details Modal - Visual Guide

## 📱 User Flow

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT COORDINATOR > STUDENT MANAGEMENT               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Select Year: [2025-26 ▼]  Semester: [1 ▼]             │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Search: _________________ (3 students)            │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 👤 John Doe          24BCE1001                   │   │
│ │ john.doe@vit...      +91 9876543210              │   │
│ │ PPT: ✓ 3/3 Approved  Marks: 85/100              │   │
│ │ Guide: Dr. Rajesh    Panel: Dr. Priya            │   │
│ │                                   [Details ▼]    │   │
│ └───────────────────────────────────────────────────┘   │
│                                       ↓ Click            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 👤 Jane Smith        24BCE1002                   │   │
│ │ jane.smith@vit...    +91 9876543211              │   │
│ │ PPT: ✓ 2/3 Approved  Marks: 78/100              │   │
│ │ Guide: Dr. Rajesh    Panel: Dr. Priya            │   │
│ │                                   [Details ▼]    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🖼️ Modal Layout

```
╔═══════════════════════════════════════════════════════════╗
║ Student Details                                         × ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ ╭─────────────────────────────────────────────────────╮  ║
║ │ [👤]  John Doe                                      │  ║
║ │       24BCE1001                                     │  ║
║ │       B.Tech CSE • 4th Year                        │  ║
║ ╰─────────────────────────────────────────────────────╯  ║
║                                                           ║
║ ╭─────────────────────────────────────────────────────╮  ║
║ │ 📄 PROJECT & FACULTY                               │  ║
║ │ ───────────────────────────────                   │  ║
║ │ Project: AI-Based Chatbot System                  │  ║
║ │ Guide:   Dr. Rajesh Kumar                         │  ║
║ │ Panel:   Dr. Priya Sharma                         │  ║
║ ╰─────────────────────────────────────────────────────╯  ║
║                                                           ║
║ ╭──────────────────────────┬──────────────────────────╮  ║
║ │ 📧 CONTACT INFO          │ 📊 MARKS                │  ║
║ │ ─────────────────        │ ────────                │  ║
║ │ Email                    │ Total Marks             │  ║
║ │ john.doe@vitstud... │ 85/100              │  ║
║ │ ───────────────────        │ ────────────────        │  ║
║ │ Phone                    │ Guide:    50            │  ║
║ │ +91 9876543210      │ Panel:    35            │  ║
║ │                         │ (Click for details)     │  ║
║ ╰──────────────────────────┴──────────────────────────╯  ║
║                                                           ║
║ ╭─────────────────────────────────────────────────────╮  ║
║ │ 📋 PRESENTATION STATUS                              │  ║
║ │ ──────────────────────────────────────────────     │  ║
║ │ ✓ Dr. Rajesh Kumar  Done       2025-02-15         │  ║
║ │ ✓ Dr. Priya Sharma  Done       2025-02-20         │  ║
║ │ ⏱ Dr. Amit Patel    Pending    (Not approved)      │  ║
║ ╰─────────────────────────────────────────────────────╯  ║
║                                                           ║
║ ╭─────────────────────────────────────────────────────╮  ║
║ │ 👥 TEAM MEMBERS (2)                                 │  ║
║ │ ──────────────────────────────────────────────     │  ║
║ │ Jane Smith (24BCE1002)                   [View]    │  ║
║ │ Mike Johnson (24BCE1003)                 [View]    │  ║
║ ╰─────────────────────────────────────────────────────╯  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🔄 Navigation Flow

```
StudentList
    │
    ├─→ Click "Details" button
    │
    └─→ handleViewDetails(student)
        │
        ├─→ setSelectedStudent(student)
        ├─→ setShowModal(true)
        │
        └─→ Render StudentDetailsModal
            │
            ├─→ StudentHeader (show name, reg#)
            ├─→ ProjectFacultyCard (show project)
            ├─→ ContactCard (show email, phone)
            ├─→ MarksCard (show marks - clickable)
            ├─→ ReviewStatusCard (show approvals)
            │
            └─→ TeamMembersCard
                │
                ├─→ Show list of teammates
                │
                └─→ Click teammate "View" button
                    │
                    └─→ handleNavigateToStudent(teammate)
                        │
                        └─→ setSelectedStudent(teammate)
                            │
                            └─→ Modal updates with teammate details
```

## 🎯 Component Breakdown

### StudentDetailsModal (Parent)
```jsx
<Modal isOpen={showModal} onClose={onClose}>
  <StudentHeader student={student} />
  <ProjectFacultyCard student={student} />
  <div className="grid grid-cols-2">
    <ContactCard student={student} />
    <MarksCard marks={marks} />
  </div>
  <ReviewStatusCard reviewStatuses={student.reviewStatuses} />
  <TeamMembersCard teammates={student.teammates} />
</Modal>
```

### StudentHeader
- Shows student avatar/icon
- Name and registration number
- Program and year information
- Blue gradient background

### ProjectFacultyCard
- 📄 Project Title icon
- 🎓 Guide name
- 👤 Panel member name
- Info rows with icons

### ContactCard
- 📧 Email icon + email address
- 📞 Phone icon + phone number
- Clean, organized layout

### MarksCard
- 📊 Chart icon
- Large bold total marks display
- Grid showing guide vs panel marks
- Clickable for detailed breakdown

### ReviewStatusCard
- 📋 Document icon
- Approval count summary
- Status badge for each review
- Faculty name and approval date
- Visual indicators (✓, ⏱, ✗)

### TeamMembersCard
- 👥 Group icon
- List of team members
- Registration numbers
- "View" button for each teammate
- Hover effects

## 📊 Data Flow Diagram

```
Sample Data
├── Projects
│   └── Different for each year/semester
├── Students
│   ├── 24BCE1001 (John)
│   │   ├── name: "John Doe"
│   │   ├── email: "john.doe@..."
│   │   ├── guide: "Dr. Rajesh Kumar"
│   │   ├── totalMarks: 85
│   │   └── teammates: [Jane, Mike]
│   └── 24BCE1002 (Jane)
│       └── Similar structure
└── Faculty
    └── Different for each semester

         ↓ (filtered by year/semester)

   StudentManagement Page
   │
   ├─ Fetch filtered data
   ├─ Display in StudentList
   │
   └─ StudentList
      └─ Student Cards
         └─ Click "Details"
            └─ StudentDetailsModal
               └─ Display all details
```

## 🎨 Color Scheme

```
Header:          Blue gradient (from-blue-50 to-blue-100)
Cards:           White backgrounds with subtle borders
Icons:           Blue (#2563eb) for primary actions
Status:
  - Approved:    Green (#10b981)
  - Pending:     Yellow (#f59e0b)
  - Rejected:    Red (#ef4444)
Marks:
  - Guide:       Blue (#1e40af)
  - Panel:       Purple (#6d28d9)
```

## ⚡ Interactions

| Action | Result |
|--------|--------|
| Click "Details" button | Modal opens with student details |
| Click teammate name | Teammate's details shown in modal |
| Click "View" on teammate | Same as above |
| Click marks card | (Expandable for details) |
| Click X or outside | Modal closes |
| Modal open → Scroll | Details scroll within modal |

## 🔐 Responsive Behavior

### Mobile (< 768px)
```
┌─────────────┐
│   Header    │
├─────────────┤
│   Project   │
├─────────────┤
│   Contact   │
├─────────────┤
│   Marks     │
├─────────────┤
│   Reviews   │
├─────────────┤
│   Team      │
└─────────────┘
```

### Tablet (≥ 768px)
```
┌──────────────────────┐
│   Header             │
├──────────────────────┤
│   Project            │
├──────────┬───────────┤
│ Contact  │  Marks    │
├──────────────────────┤
│   Reviews            │
├──────────────────────┤
│   Team               │
└──────────────────────┘
```

### Desktop (≥ 1024px)
```
┌──────────────────────────┐
│   Header                 │
├──────────────────────────┤
│   Project                │
├──────────────┬───────────┤
│   Contact    │   Marks   │
├──────────────────────────┤
│   Reviews                │
├──────────────────────────┤
│   Team                   │
└──────────────────────────┘
```

## 📚 Related Files

| File | Purpose |
|------|---------|
| `StudentList.jsx` | Lists students, opens modal |
| `StudentManagement.jsx` | Page wrapper, handles filtering |
| `sampleData.js` | Provides filtered student data |
| `AcademicFilterSelector.jsx` | Year/semester selection |
| `shared/Modal.jsx` | Modal wrapper component |
| `shared/Card.jsx` | Card wrapper component |
| `shared/Badge.jsx` | Status badges |
| `shared/Button.jsx` | Buttons |

---

**Quick Start**: Click "Details" on any student in the StudentManagement page to see the full implementation in action!
