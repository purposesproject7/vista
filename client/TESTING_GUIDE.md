# Testing the Student Management System

## 🧪 How to Test (Before Backend Integration)

### Option 1: Mock API Interceptor (Recommended)

Create a mock API interceptor to return test data:

**Create**: `src/features/admin/utils/mockApiInterceptor.js`

```javascript
import api from '../../../services/api';
import MockAdapter from 'axios-mock-adapter';
import {
  mockSchools,
  mockProgrammes,
  mockYears,
  mockSemesters,
  mockStudents,
  getStudentById
} from './mockStudentData';

// Create mock adapter
const mock = new MockAdapter(api, { delayResponse: 500 });

// Mock academic context endpoints
mock.onGet('/admin/schools').reply(200, mockSchools);

mock.onGet(/\/admin\/schools\/\d+\/programmes/).reply((config) => {
  const schoolId = config.url.split('/')[3];
  return [200, mockProgrammes[schoolId] || []];
});

mock.onGet(/\/admin\/schools\/\d+\/programmes\/\d+\/years/).reply(200, mockYears);

mock.onGet(/\/admin\/schools\/\d+\/programmes\/\d+\/years\/\d+\/semesters/).reply(200, mockSemesters);

// Mock student endpoints
mock.onGet('/admin/students').reply(200, mockStudents);

mock.onGet(/\/admin\/students\/\d+/).reply((config) => {
  const studentId = config.url.split('/')[3];
  const student = getStudentById(studentId);
  return student ? [200, student] : [404, { message: 'Student not found' }];
});

export default mock;
```

**Install axios-mock-adapter**:
```bash
npm install axios-mock-adapter --save-dev
```

**Import in StudentManagement.jsx**:
```javascript
// At the top of StudentManagement.jsx (only for testing)
import '../utils/mockApiInterceptor';
```

---

### Option 2: MSW (Mock Service Worker)

More advanced option for API mocking:

```bash
npm install msw --save-dev
```

Create `src/mocks/handlers.js`:
```javascript
import { rest } from 'msw';
import { mockSchools, mockStudents, getStudentById } from '../features/admin/utils/mockStudentData';

export const handlers = [
  rest.get('/api/admin/schools', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSchools));
  }),
  
  rest.get('/api/admin/students', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStudents));
  }),
  
  rest.get('/api/admin/students/:id', (req, res, ctx) => {
    const student = getStudentById(req.params.id);
    return student 
      ? res(ctx.status(200), ctx.json(student))
      : res(ctx.status(404));
  })
];
```

---

### Option 3: Temporary Mock in Component

Simplest option - directly modify `StudentManagement.jsx`:

```javascript
// Replace useEffect with mock data
useEffect(() => {
  if (filters) {
    // fetchStudents(); // Comment out real API call
    
    // Use mock data instead
    import('../utils/mockStudentData').then(({ mockStudents }) => {
      setStudents(mockStudents);
      setLoading(false);
    });
  }
}, [filters]);
```

---

## 🎯 Test Scenarios

### 1. Filter Selection Flow
- ✅ Select School → Should unlock Programme dropdown
- ✅ Select Programme → Should unlock Year dropdown  
- ✅ Select Year → Should unlock Semester dropdown
- ✅ Select Semester → Should show "Complete" badge
- ✅ Progress bar should go from 0/4 to 4/4

### 2. Student List Display
- ✅ Should show 10 mock students after filters complete
- ✅ Search "Rajesh" → Should filter to 1 student
- ✅ Search "21BCE1001" → Should filter by reg number
- ✅ Search "vitstudent" → Should filter by email
- ✅ Empty search → Should show all students

### 3. PPT Status Badges
- ✅ "Rajesh Kumar" → Green "Approved" badge
- ✅ "Sneha Reddy" → Yellow "Pending" badge
- ✅ "Kavya Menon" → Red "Rejected" badge
- ✅ "Arjun Nair" → Gray "Not Submitted" badge

### 4. Student Details Modal
- ✅ Click "Details" on any student → Modal should open
- ✅ Should show all student information
- ✅ Click teammate name → Should close modal and open teammate's details
- ✅ Press ESC → Should close modal
- ✅ Click outside modal → Should close modal

### 5. Marks Display
- ✅ "Rajesh Kumar" → Should show "87/100"
- ✅ "Sneha Reddy" → Should show "Not Graded"
- ✅ In modal → Should show guide marks (45) and panel marks (42)

### 6. Team Members
- ✅ "Rajesh Kumar" → Should show 2 teammates
- ✅ "Kavya Menon" → Should show no teammates
- ✅ Click teammate → Should navigate to their details

### 7. Responsive Design
- ✅ Test on mobile (< 768px)
- ✅ Test on tablet (768px - 1024px)
- ✅ Test on desktop (> 1024px)
- ✅ Filters should stack on mobile

### 8. Empty States
- ✅ No students → Should show empty state message
- ✅ No search results → Should show "Try adjusting your search"

### 9. Loading States
- ✅ While fetching students → Should show spinner
- ✅ While fetching options → Should show "Loading options..."

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'map' of undefined"
**Solution**: Check that API returns an array, not an object

### Issue: Modal doesn't close
**Solution**: Check that `onClose` prop is passed correctly

### Issue: Filters don't cascade
**Solution**: Verify that dependency array in useEffect is correct

### Issue: Search doesn't work
**Solution**: Ensure student properties (name, regNo, email) exist in data

### Issue: Teammate navigation doesn't work
**Solution**: Check that `onNavigateToStudent` is passed to modal

---

## 📊 Test Data Overview

### Mock Students (10 total)

| Name | Reg No | PPT Status | Marks | Team Size |
|------|--------|------------|-------|-----------|
| Rajesh Kumar | 21BCE1001 | Approved | 87 | 3 |
| Priya Singh | 21BCE1002 | Approved | 85 | 3 |
| Amit Patel | 21BCE1003 | Approved | 88 | 3 |
| Sneha Reddy | 21BCE1004 | Pending | - | 2 |
| Vikram Joshi | 21BCE1005 | Pending | - | 2 |
| Kavya Menon | 21BCE1006 | Rejected | - | 1 (solo) |
| Arjun Nair | 21BCE1007 | Not Submitted | - | 2 |
| Divya Mohan | 21BCE1008 | Not Submitted | - | 2 |
| Karthik Subramanian | 21BCE1009 | Approved | 92 | 3 |
| Lakshmi Rao | 21BCE1010 | Approved | 90 | 3 |

### PPT Status Distribution
- ✅ Approved: 5 students
- ⏳ Pending: 2 students
- ❌ Rejected: 1 student
- ⚪ Not Submitted: 2 students

---

## 🔍 Manual Testing Checklist

```
[ ] Navigate to /admin/students
[ ] Login screen appears (if not logged in)
[ ] Login with admin credentials
[ ] See "Student Management" page
[ ] Filter selector is visible at top
[ ] Select School: SCOPE
[ ] Programme dropdown becomes enabled
[ ] Select Programme: B.Tech CSE
[ ] Year dropdown becomes enabled
[ ] Select Year: 2025-26
[ ] Semester dropdown becomes enabled
[ ] Select Semester: Winter Semester
[ ] "Complete" badge appears
[ ] Progress bar shows 4/4
[ ] Student list loads automatically
[ ] See 10 students in list
[ ] Each student card shows:
    [ ] Name and reg number
    [ ] Email and phone
    [ ] PPT status badge
    [ ] Total marks
    [ ] Guide name
    [ ] Panel member name
    [ ] Teammates (if any)
    [ ] "Details" button
[ ] Search for "Rajesh"
[ ] Only 1 result shown
[ ] Clear search
[ ] All 10 students shown again
[ ] Click "Details" on Rajesh Kumar
[ ] Modal opens with full details
[ ] See contact info section
[ ] See PPT status with green checkmark
[ ] See marks: 87/100
[ ] See guide marks: 45, panel marks: 42
[ ] See guide: Dr. Anita Sharma
[ ] See panel: Dr. Rakesh Verma
[ ] See 2 teammates listed
[ ] Click on "Priya Singh" teammate
[ ] Modal closes
[ ] Priya's details modal opens
[ ] Press ESC
[ ] Modal closes
[ ] Try on mobile device/responsive mode
[ ] All elements stack properly
[ ] Text is readable
[ ] Buttons are tappable
```

---

## ✅ When Backend is Ready

1. **Remove mock imports** from components
2. **Update API_BASE_URL** in `config.js` if needed
3. **Test with real data**
4. **Verify all API endpoints match** expected format
5. **Check error handling** works with real errors
6. **Test with large datasets** (pagination if needed)
7. **Verify authentication** works correctly
8. **Test role-based access** (admin vs coordinator)

---

## 🚀 Go Live Checklist

```
[ ] Backend APIs implemented and tested
[ ] Frontend successfully fetches real data
[ ] Authentication works
[ ] Authorization works (admin/coordinator only)
[ ] Search works with real data
[ ] Student details load correctly
[ ] Teammate navigation works
[ ] All edge cases handled (no phone, no teammates, etc.)
[ ] Responsive on all devices
[ ] Performance is acceptable (loading times < 2s)
[ ] Error messages are user-friendly
[ ] No console errors
[ ] Code is commented and clean
[ ] Documentation is up to date
```

---

**Happy Testing! 🎉**
