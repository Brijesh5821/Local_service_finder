import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)
    role: str = "User" # User or Provider
    
    # Profile & Address info
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # Provider exclusive info
    provider_category: Optional[str] = None
    experience: Optional[int] = None
    description: Optional[str] = None
    skills: Optional[List[str]] = []
    hourly_rate: Optional[float] = None
    availability: Optional[Dict[str, List[str]]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: Optional[float] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 3:
            raise ValueError("Full name must be at least 3 characters long.")
        if not re.search(r"[a-zA-Z]", cleaned):
            raise ValueError("Full name must contain letters.")
        return cleaned

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        # Allow 10 digits or international format (+919876543210 etc.)
        if not re.match(r"^(\+?\d{1,4})?\d{10}$", cleaned):
            raise ValueError("Please provide a valid 10-digit phone number.")
        return cleaned

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in ["User", "Provider"]:
            raise ValueError("Registration is only permitted for 'User' or 'Provider' roles.")
        return normalized

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        from app.config.security import validate_password_strength
        is_valid, msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(msg)
        return v

    @field_validator('hourly_rate')
    @classmethod
    def validate_hourly_rate(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Hourly rate must be a positive number.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        from app.config.security import validate_password_strength
        is_valid, msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(msg)
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        from app.config.security import validate_password_strength
        is_valid, msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(msg)
        return v