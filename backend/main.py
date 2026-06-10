from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth_router import router as auth_router
from routers.student_router import router as student_router
from routers.admin_router import router as admin_router

app = FastAPI(title="Course Connect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(student_router, prefix="/student", tags=["student"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/health")
def health():
    return {"status": "ok"}
