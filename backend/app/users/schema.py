from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: str = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: str
    role: str
    created_at: datetime