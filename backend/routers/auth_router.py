import re
from fastapi import APIRouter, HTTPException
from auth import verify_password, create_access_token, hash_password
from database import supabase
from models import LoginRequest, TokenResponse

router = APIRouter()

# Format: k224567@nu.edu.pk  (k + 2-digit year + 4-digit roll)
STUDENT_EMAIL_RE = re.compile(r"^k\d{6}@nu\.edu\.pk$", re.IGNORECASE)


def _extract_student_id(email: str) -> str:
    """Extract '22K-4567' from 'k224567@nu.edu.pk'."""
    username = email.split("@")[0].lower()   # k224567
    year = username[1:3]                      # 22
    roll = username[3:]                       # 4567
    return f"{year}K-{roll}"                  # 22K-4567


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):

    # ── Student ───────────────────────────────────────────
    if body.role == "student":
        if not STUDENT_EMAIL_RE.match(body.username):
            raise HTTPException(
                status_code=400,
                detail="Student login must use your university email (e.g. 22K-4567@nu.edu.pk)",
            )

        student_id = _extract_student_id(body.username)
        res = supabase.table("students").select("*").eq("student_id", student_id).execute()

        if not res.data:
            # Auto-register — first login creates the account
            insert = supabase.table("students").insert({
                "student_id": student_id,
                "name": student_id,          # placeholder; can be updated later
                "password_hash": hash_password(body.password),
            }).execute()
            student = insert.data[0]
        else:
            student = res.data[0]
            if not verify_password(body.password, student["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({
            "sub": student["id"],
            "role": "student",
            "name": student["name"],
        })
        return TokenResponse(
            access_token=token,
            role="student",
            user_id=student["id"],
            name=student["name"],
        )

    # ── Admin ─────────────────────────────────────────────
    elif body.role == "admin":
        res = supabase.table("admins").select("*").eq("admin_id", body.username).execute()

        if not res.data:
            # Auto-register — first login creates the account
            insert = supabase.table("admins").insert({
                "admin_id": body.username,
                "name": body.username,
                "password_hash": hash_password(body.password),
            }).execute()
            admin = insert.data[0]
        else:
            admin = res.data[0]
            if not verify_password(body.password, admin["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({
            "sub": admin["id"],
            "role": "admin",
            "name": admin["name"],
        })
        return TokenResponse(
            access_token=token,
            role="admin",
            user_id=admin["id"],
            name=admin["name"],
        )

    raise HTTPException(status_code=400, detail="Role must be 'student' or 'admin'")
