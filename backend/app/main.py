from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.auth.routes import router as auth_router

app = FastAPI()

app.include_router(users_router)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)