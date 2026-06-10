from fastapi import APIRouter, HTTPException, Depends
from auth import require_admin
from database import supabase
from models import CourseOut, CourseCreate, CourseUpdate, EnrolledStudentOut
from typing import List

router = APIRouter()


def _enrolled_count(course_id: str) -> int:
    res = (
        supabase.table("enrollments")
        .select("id", count="exact")
        .eq("course_id", course_id)
        .execute()
    )
    return res.count or 0


@router.get("/courses", response_model=List[CourseOut])
async def list_courses(_: dict = Depends(require_admin)):
    res = supabase.rpc("get_courses_with_enrollment").execute()
    return [
        {
            "id": str(r["id"]),
            "course_code": r["course_code"],
            "course_name": r["course_name"],
            "credit_hours": int(r["credit_hours"]),
            "capacity": int(r["capacity"]),
            "enrolled": int(r.get("enrolled", 0)),
        }
        for r in res.data
    ]


@router.post("/courses", response_model=CourseOut, status_code=201)
async def add_course(body: CourseCreate, _: dict = Depends(require_admin)):
    # Check duplicate course code
    existing = (
        supabase.table("courses")
        .select("id")
        .eq("course_code", body.course_code)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Course code already exists")

    res = supabase.table("courses").insert({
        "course_code": body.course_code,
        "course_name": body.course_name,
        "credit_hours": body.credit_hours,
        "capacity": body.capacity,
    }).execute()
    c = res.data[0]
    return {**c, "id": str(c["id"]), "enrolled": 0}


@router.put("/courses/{course_id}", response_model=CourseOut)
async def update_course(course_id: str, body: CourseUpdate, _: dict = Depends(require_admin)):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = supabase.table("courses").update(updates).eq("id", course_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    c = res.data[0]
    return {**c, "id": str(c["id"]), "enrolled": _enrolled_count(course_id)}


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(course_id: str, _: dict = Depends(require_admin)):
    res = supabase.table("courses").delete().eq("id", course_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Course not found")


@router.get("/courses/{course_id}/students", response_model=List[EnrolledStudentOut])
async def get_enrolled_students(course_id: str, _: dict = Depends(require_admin)):
    res = (
        supabase.table("enrollments")
        .select("students(id, student_id, name)")
        .eq("course_id", course_id)
        .execute()
    )
    return [
        {
            "id": str(row["students"]["id"]),
            "student_id": row["students"]["student_id"],
            "name": row["students"]["name"],
        }
        for row in res.data
    ]


@router.delete("/courses/{course_id}/students/{student_id}", status_code=204)
async def remove_student_from_course(
    course_id: str, student_id: str, _: dict = Depends(require_admin)
):
    res = (
        supabase.table("enrollments")
        .delete()
        .eq("course_id", course_id)
        .eq("student_id", student_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Enrollment not found")
