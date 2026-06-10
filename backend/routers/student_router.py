from fastapi import APIRouter, HTTPException, Depends
from auth import require_student
from database import supabase
from models import CourseOut, CompletedCourseOut, StudentOut, RegisterRequest
from typing import List

router = APIRouter()

SEMESTER_CREDIT_LIMIT = 15


def _fmt_course(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "course_code": row["course_code"],
        "course_name": row["course_name"],
        "credit_hours": int(row["credit_hours"]),
        "capacity": int(row["capacity"]),
        "enrolled": int(row.get("enrolled", 0)),
    }


def _current_enrolled_credits(student_id: str) -> int:
    res = (
        supabase.table("enrollments")
        .select("courses(credit_hours)")
        .eq("student_id", student_id)
        .execute()
    )
    return sum(row["courses"]["credit_hours"] for row in res.data)


@router.get("/profile", response_model=StudentOut)
async def get_profile(user: dict = Depends(require_student)):
    student_id = user["sub"]
    res = supabase.table("students").select("*").eq("id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    s = res.data[0]
    return {
        "id": str(s["id"]),
        "student_id": s["student_id"],
        "name": s["name"],
        "credits_attempted": s["credits_attempted"],
        "credits_earned": s["credits_earned"],
        "total_credits": s["total_credits"],
        "cgpa": float(s["cgpa"]),
    }


@router.get("/completed-courses", response_model=List[CompletedCourseOut])
async def get_completed_courses(user: dict = Depends(require_student)):
    student_id = user["sub"]
    res = (
        supabase.table("completed_courses")
        .select("grade, courses(*)")
        .eq("student_id", student_id)
        .execute()
    )
    courses = []
    for row in res.data:
        c = row["courses"]
        count_res = (
            supabase.table("enrollments")
            .select("id", count="exact")
            .eq("course_id", c["id"])
            .execute()
        )
        courses.append({**_fmt_course({**c, "enrolled": count_res.count or 0}), "grade": row["grade"]})
    return courses


@router.get("/registered-courses", response_model=List[CourseOut])
async def get_registered_courses(user: dict = Depends(require_student)):
    student_id = user["sub"]
    res = (
        supabase.table("enrollments")
        .select("courses(*)")
        .eq("student_id", student_id)
        .execute()
    )
    courses = []
    for row in res.data:
        c = row["courses"]
        count_res = (
            supabase.table("enrollments")
            .select("id", count="exact")
            .eq("course_id", c["id"])
            .execute()
        )
        courses.append(_fmt_course({**c, "enrolled": count_res.count or 0}))
    return courses


@router.get("/available-courses", response_model=List[CourseOut])
async def get_available_courses(user: dict = Depends(require_student)):
    student_id = user["sub"]
    res = supabase.rpc(
        "get_available_courses_for_student", {"p_student_id": student_id}
    ).execute()
    return [_fmt_course(r) for r in res.data]


@router.post("/register", response_model=List[CourseOut])
async def register_courses(body: RegisterRequest, user: dict = Depends(require_student)):
    student_id = user["sub"]

    if not body.course_ids:
        raise HTTPException(status_code=400, detail="No courses selected")

    # ── Credit hour limit check ───────────────────────────
    current_credits = _current_enrolled_credits(student_id)

    new_credits = 0
    courses_to_register = []
    for course_id in body.course_ids:
        course_res = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_res.data:
            raise HTTPException(status_code=404, detail=f"Course {course_id} not found")
        courses_to_register.append(course_res.data[0])
        new_credits += course_res.data[0]["credit_hours"]

    if current_credits + new_credits > SEMESTER_CREDIT_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Semester limit is {SEMESTER_CREDIT_LIMIT} credit hours. "
                f"You have {current_credits} CH registered and are trying to add {new_credits} CH."
            ),
        )

    # ── Per-course validation ─────────────────────────────
    for course in courses_to_register:
        course_id = course["id"]

        count_res = (
            supabase.table("enrollments")
            .select("id", count="exact")
            .eq("course_id", course_id)
            .execute()
        )
        if (count_res.count or 0) >= course["capacity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Course {course['course_code']} is full",
            )

        existing = (
            supabase.table("enrollments")
            .select("id")
            .eq("student_id", student_id)
            .eq("course_id", course_id)
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail=f"Already enrolled in {course['course_code']}",
            )

    # ── Insert ────────────────────────────────────────────
    rows = [{"student_id": student_id, "course_id": c["id"]} for c in courses_to_register]
    supabase.table("enrollments").insert(rows).execute()

    return await get_registered_courses(user)


@router.delete("/courses/{course_id}", status_code=204)
async def drop_course(course_id: str, user: dict = Depends(require_student)):
    student_id = user["sub"]
    res = (
        supabase.table("enrollments")
        .delete()
        .eq("student_id", student_id)
        .eq("course_id", course_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Enrollment not found")
