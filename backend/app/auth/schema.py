from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=6)
    role: str = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str