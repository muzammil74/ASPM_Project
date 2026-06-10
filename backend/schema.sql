-- ============================================================
-- Course Connect - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Drop everything cleanly before recreating (safe to re-run)
DROP FUNCTION IF EXISTS get_available_courses_for_student(UUID);
DROP FUNCTION IF EXISTS get_courses_with_enrollment();
DROP TABLE IF EXISTS completed_courses CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  credits_attempted INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  total_credits INTEGER DEFAULT 130,
  cgpa DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 3,
  capacity INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments (currently registered courses)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Completed courses (course history)
CREATE TABLE completed_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  grade VARCHAR(2) DEFAULT 'A',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- Helper: All courses with real-time enrollment count
-- ============================================================
CREATE OR REPLACE FUNCTION get_courses_with_enrollment()
RETURNS TABLE (
  id UUID,
  course_code TEXT,
  course_name TEXT,
  credit_hours INTEGER,
  capacity INTEGER,
  enrolled BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id,
    c.course_code,
    c.course_name,
    c.credit_hours,
    c.capacity,
    COUNT(e.id) AS enrolled
  FROM courses c
  LEFT JOIN enrollments e ON c.id = e.course_id
  GROUP BY c.id
  ORDER BY c.course_code;
$$;

-- ============================================================
-- Helper: Available courses for a specific student
-- (not completed, not enrolled, has remaining capacity)
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_courses_for_student(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  course_code TEXT,
  course_name TEXT,
  credit_hours INTEGER,
  capacity INTEGER,
  enrolled BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id,
    c.course_code,
    c.course_name,
    c.credit_hours,
    c.capacity,
    COUNT(e_all.id) AS enrolled
  FROM courses c
  LEFT JOIN enrollments e_all ON c.id = e_all.course_id
  WHERE
    c.id NOT IN (
      SELECT course_id FROM enrollments WHERE student_id = p_student_id
    )
    AND c.id NOT IN (
      SELECT course_id FROM completed_courses WHERE student_id = p_student_id
    )
  GROUP BY c.id
  ORDER BY c.course_code;
$$;
