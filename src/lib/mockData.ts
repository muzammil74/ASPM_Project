export interface Student {
  id: string;
  name: string;
  studentId: string;
  creditsAttempted: number;
  creditsEarned: number;
  totalCredits: number;
  cgpa: number;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  creditHours: number;
  capacity: number;
  enrolled: number;
}

export interface EnrolledStudent {
  studentId: string;
  name: string;
}

export const mockStudent: Student = {
  id: "1",
  name: "Muzammil Saleem Shaikh",
  studentId: "22K-4567",
  creditsAttempted: 115,
  creditsEarned: 115,
  totalCredits: 130,
  cgpa: 3.2,
};

export const mockCompletedCourses: Course[] = [
  { id: "c1", courseCode: "CS-3001", courseName: "Deep Learning For Perception", creditHours: 3, capacity: 40, enrolled: 38 },
  { id: "c2", courseCode: "CS-3002", courseName: "Data Science", creditHours: 3, capacity: 45, enrolled: 42 },
  { id: "c3", courseCode: "CS-3003", courseName: "Artificial Intelligence", creditHours: 3, capacity: 50, enrolled: 48 },
  { id: "c4", courseCode: "CS-3004", courseName: "GenAI", creditHours: 3, capacity: 35, enrolled: 33 },
  { id: "c5", courseCode: "CS-3005", courseName: "DevOps", creditHours: 3, capacity: 40, enrolled: 37 },
  { id: "c6", courseCode: "CS-2001", courseName: "Software Engineering", creditHours: 3, capacity: 60, enrolled: 55 },
  { id: "c7", courseCode: "CS-3006", courseName: "Information Security", creditHours: 3, capacity: 45, enrolled: 40 },
  { id: "c8", courseCode: "CS-4057", courseName: "Agile Software Project Management", creditHours: 3, capacity: 40, enrolled: 36 },
  { id: "c9", courseCode: "CS-3007", courseName: "Natural Language Processing", creditHours: 3, capacity: 35, enrolled: 32 },
  { id: "c10", courseCode: "CS-2002", courseName: "Computer Networks", creditHours: 3, capacity: 55, enrolled: 50 },
  { id: "c11", courseCode: "CS-2003", courseName: "Compiler Construction", creditHours: 3, capacity: 45, enrolled: 41 },
];

export const mockRegisteredCourses: Course[] = [
  { id: "r1", courseCode: "CS-4001", courseName: "Recommender System", creditHours: 3, capacity: 40, enrolled: 28 },
  { id: "r2", courseCode: "CS-4002", courseName: "Software Testing", creditHours: 3, capacity: 45, enrolled: 35 },
];

export const mockAvailableCourses: Course[] = [
  { id: "a1", courseCode: "CS-4003", courseName: "Recommender System", creditHours: 3, capacity: 40, enrolled: 28 },
  { id: "a2", courseCode: "CS-4004", courseName: "Software Testing", creditHours: 3, capacity: 45, enrolled: 35 },
  { id: "a3", courseCode: "CS-4005", courseName: "Quantum Computing", creditHours: 3, capacity: 30, enrolled: 18 },
  { id: "a4", courseCode: "CS-4006", courseName: "Blockchain Technology", creditHours: 3, capacity: 35, enrolled: 22 },
  { id: "a5", courseCode: "CS-4007", courseName: "Cloud Architecture", creditHours: 3, capacity: 40, enrolled: 30 },
  { id: "a6", courseCode: "CS-4008", courseName: "IoT Systems", creditHours: 3, capacity: 35, enrolled: 20 },
];

export const mockAllCourses: Course[] = [
  { id: "ac1", courseCode: "CS-4001", courseName: "Recommender System", creditHours: 3, capacity: 40, enrolled: 28 },
  { id: "ac2", courseCode: "CS-4002", courseName: "Software Testing", creditHours: 3, capacity: 45, enrolled: 35 },
  { id: "ac3", courseCode: "CS-4003", courseName: "Quantum Computing", creditHours: 3, capacity: 30, enrolled: 18 },
  { id: "ac4", courseCode: "CS-4004", courseName: "Blockchain Technology", creditHours: 3, capacity: 35, enrolled: 22 },
];

export const mockEnrolledStudents: EnrolledStudent[] = [
  { studentId: "22K-4567", name: "Muzammil Saleem Shaikh" },
  { studentId: "22K-4561", name: "Rayyan Zafar Jaffery" },
  { studentId: "22K-4299", name: "Sarim Shah" },
];
