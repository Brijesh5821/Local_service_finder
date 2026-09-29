from app.auth import service
from app.auth.schema import RegisterRequest, LoginRequest


def register(user: RegisterRequest):
    return service.register_user(user)

from app.auth.schema import LoginRequest


def login(user: LoginRequest):
    return service.login_user(user)


def google_login(token: str):
    return service.google_login_user(token)