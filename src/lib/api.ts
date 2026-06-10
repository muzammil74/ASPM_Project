const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  name: string;
}

export function login(username: string, password: string, role: string) {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  });
}

// ── Shared types ──────────────────────────────────────────
export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credit_hours: number;
  capacity: number;
  enrolled: number;
}

export interface CompletedCourse extends Course {
  grade: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  credits_attempted: number;
  credits_earned: number;
  total_credits: number;
  cgpa: number;
}

export interface EnrolledStudent {
  id: string;
  student_id: string;
  name: string;
}

// ── Student ───────────────────────────────────────────────
export const studentApi = {
  profile: () => request<Student>("/student/profile"),
  completedCourses: () => request<CompletedCourse[]>("/student/completed-courses"),
  registeredCourses: () => request<Course[]>("/student/registered-courses"),
  availableCourses: () => request<Course[]>("/student/available-courses"),
  register: (course_ids: string[]) =>
    request<Course[]>("/student/register", {
      method: "POST",
      body: JSON.stringify({ course_ids }),
    }),
  dropCourse: (courseId: string) =>
    request<void>(`/student/courses/${courseId}`, { method: "DELETE" }),
};

// ── Admin ─────────────────────────────────────────────────
export const adminApi = {
  courses: () => request<Course[]>("/admin/courses"),
  addCourse: (data: { course_code: string; course_name: string; credit_hours: number; capacity: number }) =>
    request<Course>("/admin/courses", { method: "POST", body: JSON.stringify(data) }),
  updateCourse: (id: string, data: { course_name?: string; credit_hours?: number; capacity?: number }) =>
    request<Course>(`/admin/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    request<void>(`/admin/courses/${id}`, { method: "DELETE" }),
  enrolledStudents: (courseId: string) =>
    request<EnrolledStudent[]>(`/admin/courses/${courseId}/students`),
  removeStudent: (courseId: string, studentId: string) =>
    request<void>(`/admin/courses/${courseId}/students/${studentId}`, { method: "DELETE" }),
};
