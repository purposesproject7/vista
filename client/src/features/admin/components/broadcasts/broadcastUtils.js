// src/features/admin/components/broadcasts/broadcastUtils.js

export const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const toDatetimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
};

export const fromDatetimeLocalValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const schoolOptions = [
  'School of Engineering',
  'School of Business',
  'School of Arts & Sciences',
  'School of Law'
];

export const departmentOptions = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'MBA',
  'BBA',
  'Economics',
  'Physics'
];

export const generateMockBroadcasts = () => [
  {
    _id: '1',
    title: 'Review Schedule Update',
    message: 'All Review 3 sessions have been rescheduled to next week. Please check your dashboard for updated timings.',
    targetSchools: ['School of Engineering'],
    targetDepartments: ['Computer Science', 'Electronics'],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'notice',
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdByName: 'Admin User'
  },
  {
    _id: '2',
    title: 'System Maintenance',
    message: 'The portal will be under maintenance this Saturday from 2 AM to 6 AM. Please plan accordingly.',
    targetSchools: [],
    targetDepartments: [],
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'block',
    isActive: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdByName: 'System Admin'
  },
  {
    _id: '3',
    title: 'PPT Submission Deadline',
    message: 'Final PPT submissions are due by Friday 5 PM. Late submissions will not be accepted.',
    targetSchools: ['School of Business'],
    targetDepartments: [],
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'notice',
    isActive: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdByName: 'Coordinator'
  }
];
