from pydantic import BaseModel
from typing import List, Optional


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str  # "student" | "admin"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str


class CourseOut(BaseModel):
    id: str
    course_code: str
    course_name: str
    credit_hours: int
    capacity: int
    enrolled: int


class CompletedCourseOut(BaseModel):
    id: str
    course_code: str
    course_name: str
    credit_hours: int
    capacity: int
    enrolled: int
    grade: str


class StudentOut(BaseModel):
    id: str
    student_id: str
    name: str
    credits_attempted: int
    credits_earned: int
    total_credits: int
    cgpa: float


class EnrolledStudentOut(BaseModel):
    id: str        # student UUID (used for remove calls)
    student_id: str  # e.g. "22K-4567"
    name: str


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    credit_hours: int
    capacity: int


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    credit_hours: Optional[int] = None
    capacity: Optional[int] = None


class RegisterRequest(BaseModel):
    course_ids: List[str]  # list of course UUIDs
