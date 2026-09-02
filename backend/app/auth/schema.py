import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
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
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if not re.match(r"^[a-zA-Z\s]+$", cleaned):
            raise ValueError("Full name must contain letters only.")
        return cleaned

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not re.match(r"^\d{10}$", cleaned):
            raise ValueError("Please enter a valid 10-digit phone number.")
        return cleaned

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            allowed = ["Male", "Female", "Other", "Prefer not to say"]
            if cleaned not in allowed:
                raise ValueError("Please select your gender.")
            return cleaned
        return v

    @field_validator('city', 'state')
    @classmethod
    def validate_city_state(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if not re.match(r"^[a-zA-Z\s]+$", cleaned):
                raise ValueError("City and State must contain letters and spaces only.")
            return cleaned
        return v

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if not re.match(r"^\d{6}$", cleaned):
                raise ValueError("Please enter a valid 6-digit pincode.")
            return cleaned
        return v

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        normalized = v.strip().lower()
        if normalized in ["admin", "superadmin", "administrator"]:
            raise ValueError("Public registration as Admin is not permitted.")
        if normalized in ["user", "customer"]:
            return "User"
        elif normalized == "provider":
            return "Provider"
        else:
            raise ValueError("Registration is only permitted for 'User' or 'Provider' roles.")

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
        if v is not None and v <= 0:
            raise ValueError("Hourly rate must be a positive number greater than 0.")
        return v

    @field_validator('experience')
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 60):
            raise ValueError("Years of experience must be between 0 and 60.")
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