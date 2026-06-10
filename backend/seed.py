"""
Seed script — run once after applying schema.sql to populate initial data.
Usage:  python seed.py
"""
import os
import bcrypt
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))


def pwd_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def seed():
    print("Seeding admins...")
    supabase.table("admins").upsert([
        {
            "admin_id": "admin1",
            "name": "System Administrator",
            "password_hash": pwd_hash("admin123"),
        }
    ], on_conflict="admin_id").execute()

    print("Seeding students...")
    supabase.table("students").upsert([
        {
            "student_id": "22K-4567",
            "name": "Muzammil Saleem Shaikh",
            "password_hash": pwd_hash("student123"),
            "credits_attempted": 115,
            "credits_earned": 115,
            "total_credits": 130,
            "cgpa": 3.20,
        },
        {
            "student_id": "22K-4561",
            "name": "Rayyan Zafar Jaffery",
            "password_hash": pwd_hash("student123"),
            "credits_attempted": 90,
            "credits_earned": 87,
            "total_credits": 130,
            "cgpa": 3.05,
        },
        {
            "student_id": "22K-4299",
            "name": "Sarim Shah",
            "password_hash": pwd_hash("student123"),
            "credits_attempted": 75,
            "credits_earned": 75,
            "total_credits": 130,
            "cgpa": 3.50,
        },
    ], on_conflict="student_id").execute()

    print("Seeding courses...")
    courses = [
        # Completed / historical courses
        {"course_code": "CS-3001", "course_name": "Deep Learning For Perception", "credit_hours": 3, "capacity": 40},
        {"course_code": "CS-3002", "course_name": "Data Science", "credit_hours": 3, "capacity": 45},
        {"course_code": "CS-3003", "course_name": "Artificial Intelligence", "credit_hours": 3, "capacity": 50},
        {"course_code": "CS-3004", "course_name": "GenAI", "credit_hours": 3, "capacity": 35},
        {"course_code": "CS-3005", "course_name": "DevOps", "credit_hours": 3, "capacity": 40},
        {"course_code": "CS-2001", "course_name": "Software Engineering", "credit_hours": 3, "capacity": 60},
        {"course_code": "CS-3006", "course_name": "Information Security", "credit_hours": 3, "capacity": 45},
        {"course_code": "CS-4057", "course_name": "Agile Software Project Management", "credit_hours": 3, "capacity": 40},
        {"course_code": "CS-3007", "course_name": "Natural Language Processing", "credit_hours": 3, "capacity": 35},
        {"course_code": "CS-2002", "course_name": "Computer Networks", "credit_hours": 3, "capacity": 55},
        {"course_code": "CS-2003", "course_name": "Compiler Construction", "credit_hours": 3, "capacity": 45},
        # Currently available / enrollable courses
        {"course_code": "CS-4001", "course_name": "Recommender Systems", "credit_hours": 3, "capacity": 40},
        {"course_code": "CS-4002", "course_name": "Software Testing", "credit_hours": 3, "capacity": 45},
        {"course_code": "CS-4003", "course_name": "Quantum Computing", "credit_hours": 3, "capacity": 30},
        {"course_code": "CS-4004", "course_name": "Blockchain Technology", "credit_hours": 3, "capacity": 35},
        {"course_code": "CS-4005", "course_name": "Cloud Architecture", "credit_hours": 3, "capacity": 40},
        {"course_code": "CS-4006", "course_name": "IoT Systems", "credit_hours": 3, "capacity": 35},
    ]
    supabase.table("courses").upsert(courses, on_conflict="course_code").execute()

    # Fetch student and course IDs
    students = {s["student_id"]: s["id"] for s in supabase.table("students").select("id,student_id").execute().data}
    courses_map = {c["course_code"]: c["id"] for c in supabase.table("courses").select("id,course_code").execute().data}

    main_student   = students["22K-4567"]
    student_4561   = students["22K-4561"]
    student_4299   = students["22K-4299"]

    completed_data = [
        # 22K-4567 — senior, 11 courses done
        (main_student, [
            ("CS-3001", "A"), ("CS-3002", "A"), ("CS-3003", "B+"),
            ("CS-3004", "A"), ("CS-3005", "B"), ("CS-2001", "A"),
            ("CS-3006", "B+"), ("CS-4057", "A"), ("CS-3007", "B+"),
            ("CS-2002", "A"), ("CS-2003", "B"),
        ]),
        # 22K-4561 — mid-level, 7 courses done
        (student_4561, [
            ("CS-2001", "A"), ("CS-2002", "B+"), ("CS-2003", "B"),
            ("CS-3001", "A"), ("CS-3002", "B+"),
            ("CS-3003", "B"), ("CS-3005", "A"),
        ]),
        # 22K-4299 — junior, 5 courses done
        (student_4299, [
            ("CS-2001", "B+"), ("CS-2002", "A"), ("CS-2003", "B+"),
            ("CS-3001", "A"), ("CS-3002", "B"),
        ]),
    ]

    print("Seeding completed courses...")
    completed_rows = []
    for sid, courses_grades in completed_data:
        for code, grade in courses_grades:
            if code in courses_map:
                completed_rows.append({
                    "student_id": sid,
                    "course_id": courses_map[code],
                    "grade": grade,
                })
    supabase.table("completed_courses").upsert(
        completed_rows, on_conflict="student_id,course_id"
    ).execute()

    print("Seeding enrollments...")
    enrollments = [
        {"student_id": main_student, "course_id": courses_map["CS-4001"]},
        {"student_id": main_student, "course_id": courses_map["CS-4002"]},
        # Other students enrolled in CS-4001
        {"student_id": students["22K-4561"], "course_id": courses_map["CS-4001"]},
        {"student_id": students["22K-4299"], "course_id": courses_map["CS-4001"]},
        {"student_id": students["22K-4561"], "course_id": courses_map["CS-4002"]},
    ]
    supabase.table("enrollments").upsert(
        enrollments, on_conflict="student_id,course_id"
    ).execute()

    print("Done! Seed data inserted successfully.")
    print("\nTest credentials:")
    print("  Student 1 — Email: k224567@nu.edu.pk  Password: student123")
    print("  Student 2 — Email: k224561@nu.edu.pk  Password: student123")
    print("  Student 3 — Email: k224299@nu.edu.pk  Password: student123")
    print("  Admin     — ID:    admin1              Password: admin123")


if __name__ == "__main__":
    seed()
