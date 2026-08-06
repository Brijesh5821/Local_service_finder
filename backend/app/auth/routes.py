from fastapi import APIRouter
from app.auth import controller
from app.auth.schema import RegisterRequest, LoginRequest

router = APIRouter()


@router.post("/register")
def register(user: RegisterRequest):
    return controller.register(user)


@router.post("/login")
def login(user: LoginRequest):
    return controller.login(user)