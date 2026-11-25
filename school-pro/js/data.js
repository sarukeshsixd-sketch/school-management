/* ==========================================================================
   SchoolPro — In-Memory & LocalStorage Data Store (No Backend Required)
   ========================================================================== */
const STORAGE_KEY = 'schoolpro_db_v1';

const SCHOOL_CONSTANTS = {
  classes: [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ],
  sections: ['A', 'B', 'C'],
  subjects: [
    'Mathematics',
    'Science',
    'English',
    'Social Studies',
    'Computer Science',
    'Arts',
    'Physical Education'
  ],
  feeCategories: [
    'Tuition Fee',
    'Transport Fee',
    'Library Fee',
    'Sports Fee',
    'Examination Fee'
  ],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periods: ['09:00 AM', '10:00 AM', '11:15 AM', '12:15 PM', '02:00 PM']
};

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getInitialData() {
  const today = getTodayISO();
  return {
    users: [
      { id: 'u1', name: 'Dr. Ramesh Iyer', email: 'admin@schoolpro.edu', password: 'demo', role: 'Admin' },
      { id: 'u2', name: 'Ananya Sharma', email: 'teacher@schoolpro.edu', password: 'demo', role: 'Teacher' },
      { id: 'u3', name: 'Suresh Menon', email: 'parent@schoolpro.edu', password: 'demo', role: 'Parent' }
    ],
    students: [
      {
        id: 'STU-1001',
        name: 'Aarav Menon',
        className: 'Class 10',
        section: 'A',
        rollNo: '10A-01',
        dob: '2011-04-12',
        gender: 'Male',
        parentName: 'Suresh Menon',
        parentPhone: '+91 98401 22310',
        parentEmail: 'parent@schoolpro.edu',
        address: '42 Anna Nagar, Chennai',
        photo: ''
      },
      {
        id: 'STU-1002',
        name: 'Diya Krishnan',
        className: 'Class 10',
        section: 'A',
        rollNo: '10A-02',
        dob: '2011-07-23',
        gender: 'Female',
        parentName: 'Lakshmi Krishnan',
        parentPhone: '+91 98402 55109',
        parentEmail: 'lakshmi.k@example.com',
        address: '15 Adyar Main Rd, Chennai',
        photo: ''
      },
      {
        id: 'STU-1003',
        name: 'Rohan Verma',
        className: 'Class 9',
        section: 'B',
        rollNo: '09B-01',
        dob: '2012-02-19',
        gender: 'Male',
        parentName: 'Vikram Verma',
        parentPhone: '+91 98403 88421',
        parentEmail: 'vikram.v@example.com',
        address: '88 Velachery High Rd, Chennai',
        photo: ''
      },
      {
        id: 'STU-1004',
        name: 'Meera Sundaram',
        className: 'Class 8',
        section: 'A',
        rollNo: '08A-01',
        dob: '2013-09-05',
        gender: 'Female',
        parentName: 'Karthik Sundaram',
        parentPhone: '+91 98404 71234',
        parentEmail: 'karthik.s@example.com',
        address: '21 T. Nagar, Chennai',
        photo: ''
      },
      {
        id: 'STU-1005',
        name: 'Kabir Patel',
        className: 'Class 7',
        section: 'C',
        rollNo: '07C-01',
        dob: '2014-11-30',
        gender: 'Male',
        parentName: 'Neha Patel',
        parentPhone: '+91 98405 66712',
        parentEmail: 'neha.p@example.com',
        address: '9 Besant Nagar, Chennai',
        photo: ''
      },
      {
        id: 'STU-1006',
        name: 'Ishita Bose',
        className: 'Class 10',
        section: 'B',
        rollNo: '10B-01',
        dob: '2011-01-14',
        gender: 'Female',
        parentName: 'Arjun Bose',
        parentPhone: '+91 98406 90311',
        parentEmail: 'arjun.b@example.com',
        address: '54 Mylapore, Chennai',
        photo: ''
      }
    ],
    teachers: [
      {
        id: 'TCH-201',
        name: 'Ananya Sharma',
        email: 'teacher@schoolpro.edu',
        phone: '+91 98410 11223',
        subject: 'Mathematics',
        classesAssigned: ['Class 10', 'Class 9'],
        qualification: 'M.Sc. Mathematics, B.Ed'
      },
      {
        id: 'TCH-202',
        name: 'Rajeshwari Rao',
        email: 'rajeshwari@schoolpro.edu',
        phone: '+91 98410 33445',
        subject: 'Science',
        classesAssigned: ['Class 10', 'Class 8'],
        qualification: 'M.Sc. Physics, B.Ed'
      },
      {
        id: 'TCH-203',
        name: 'David Thomas',
        email: 'david.t@schoolpro.edu',
        phone: '+91 98410 55667',
        subject: 'English',
        classesAssigned: ['Class 7', 'Class 8', 'Class 9'],
        qualification: 'M.A. English Literature'
      },
      {
        id: 'TCH-204',
        name: 'Priya Venkatesh',
        email: 'priya.v@schoolpro.edu',
        phone: '+91 98410 77889',
        subject: 'Computer Science',
        classesAssigned: ['Class 9', 'Class 10'],
        qualification: 'B.E. Computer Science'
      }
    ],
    classSections: [
      { id: 'CS-1', className: 'Class 10', section: 'A', classTeacher: 'Ananya Sharma', room: 'Room 101' },
      { id: 'CS-2', className: 'Class 10', section: 'B', classTeacher: 'Priya Venkatesh', room: 'Room 102' },
      { id: 'CS-3', className: 'Class 9', section: 'B', classTeacher: 'Rajeshwari Rao', room: 'Room 201' },
      { id: 'CS-4', className: 'Class 8', section: 'A', classTeacher: 'David Thomas', room: 'Room 204' },
      { id: 'CS-5', className: 'Class 7', section: 'C', classTeacher: 'David Thomas', room: 'Room 302' }
    ],
    attendance: [
      { date: today, studentId: 'STU-1001', status: 'Present' },
      { date: today, studentId: 'STU-1002', status: 'Present' },
      { date: today, studentId: 'STU-1003', status: 'Absent' },
      { date: today, studentId: 'STU-1004', status: 'Present' },
      { date: today, studentId: 'STU-1005', status: 'Present' },
      { date: today, studentId: 'STU-1006', status: 'Present' }
    ],
    grades: [
      { id: 'GRD-1', studentId: 'STU-1001', subject: 'Mathematics', exam: 'Mid-Term', marks: 92, maxMarks: 100 },
      { id: 'GRD-2', studentId: 'STU-1001', subject: 'Science', exam: 'Mid-Term', marks: 88, maxMarks: 100 },
      { id: 'GRD-3', studentId: 'STU-1001', subject: 'Computer Science', exam: 'Mid-Term', marks: 96, maxMarks: 100 },
      { id: 'GRD-4', studentId: 'STU-1002', subject: 'Mathematics', exam: 'Mid-Term', marks: 85, maxMarks: 100 },
      { id: 'GRD-5', studentId: 'STU-1002', subject: 'English', exam: 'Mid-Term', marks: 91, maxMarks: 100 },
      { id: 'GRD-6', studentId: 'STU-1003', subject: 'Science', exam: 'Mid-Term', marks: 78, maxMarks: 100 }
    ],
    feeStructures: [
      { id: 'FS-1', className: 'Class 10', category: 'Tuition Fee', amount: 25000 },
      { id: 'FS-2', className: 'Class 10', category: 'Transport Fee', amount: 6000 },
      { id: 'FS-3', className: 'Class 10', category: 'Library Fee', amount: 1500 },
      { id: 'FS-4', className: 'Class 10', category: 'Sports Fee', amount: 2000 },
      { id: 'FS-5', className: 'Class 10', category: 'Examination Fee', amount: 1800 }
    ],
    feePayments: [
      {
        id: 'REC-9001',
        studentId: 'STU-1001',
        category: 'Tuition Fee',
        amountDue: 25000,
        amountPaid: 25000,
        status: 'Paid',
        date: today,
        method: 'UPI'
      },
      {
        id: 'REC-9002',
        studentId: 'STU-1002',
        category: 'Tuition Fee',
        amountDue: 25000,
        amountPaid: 15000,
        status: 'Partial',
        date: today,
        method: 'Card'
      },
      {
        id: 'REC-9003',
        studentId: 'STU-1003',
        category: 'Transport Fee',
        amountDue: 6000,
        amountPaid: 0,
        status: 'Pending',
        date: '',
        method: '-'
      },
      {
        id: 'REC-9004',
        studentId: 'STU-1004',
        category: 'Library Fee',
        amountDue: 1500,
        amountPaid: 1500,
        status: 'Paid',
        date: today,
        method: 'NetBanking'
      }
    ],
    timetables: [
      { id: 'TT-1', className: 'Class 10', section: 'A', day: 'Monday', period: '09:00 AM', subject: 'Mathematics', teacher: 'Ananya Sharma' },
      { id: 'TT-2', className: 'Class 10', section: 'A', day: 'Monday', period: '10:00 AM', subject: 'Science', teacher: 'Rajeshwari Rao' },
      { id: 'TT-3', className: 'Class 10', section: 'A', day: 'Tuesday', period: '09:00 AM', subject: 'Computer Science', teacher: 'Priya Venkatesh' },
      { id: 'TT-4', className: 'Class 10', section: 'A', day: 'Wednesday', period: '11:15 AM', subject: 'English', teacher: 'David Thomas' },
      { id: 'TT-5', className: 'Class 10', section: 'A', day: 'Thursday', period: '10:00 AM', subject: 'Social Studies', teacher: 'David Thomas' },
      { id: 'TT-6', className: 'Class 10', section: 'A', day: 'Friday', period: '02:00 PM', subject: 'Physical Education', teacher: 'Rajeshwari Rao' }
    ],
    examSchedules: [
      { id: 'EX-1', className: 'Class 10', subject: 'Mathematics', date: '2026-12-10', time: '09:30 AM - 12:30 PM', room: 'Hall A' },
      { id: 'EX-2', className: 'Class 10', subject: 'Science', date: '2026-12-12', time: '09:30 AM - 12:30 PM', room: 'Hall A' },
      { id: 'EX-3', className: 'Class 9', subject: 'English', date: '2026-12-14', time: '09:30 AM - 12:30 PM', room: 'Room 201' }
    ],
    announcements: [
      {
        id: 'ANN-1',
        title: 'Annual Science & Innovation Fair',
        message: 'Students of Classes 6–10 are invited to register their science models before Friday.',
        target: 'All Parents & Students',
        author: 'Dr. Ramesh Iyer',
        date: today
      },
      {
        id: 'ANN-2',
        title: 'Mid-Term Parent-Teacher Meeting',
        message: 'PTM for Class 10 Sections A & B will be held this Saturday from 9:30 AM to 1:00 PM.',
        target: 'Class 10',
        author: 'Ananya Sharma',
        date: today
      }
    ]
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getInitialData();
      saveStore(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch (err) {
    return getInitialData();
  }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetStore() {
  const seed = getInitialData();
  saveStore(seed);
  return seed;
}
