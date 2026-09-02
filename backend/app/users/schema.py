import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
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
    hourly_rate: Optional[float] = None
    availability: Optional[Dict[str, List[str]]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: Optional[float] = None
    holidays: Optional[List[str]] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Full name must be at least 2 characters long.")
            if not re.match(r"^[a-zA-Z\s]+$", cleaned):
                raise ValueError("Full name must contain letters only.")
            return cleaned
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().replace(" ", "").replace("-", "")
            if not re.match(r"^\d{10}$", cleaned):
                raise ValueError("Please enter a valid 10-digit phone number.")
            return cleaned
        return v

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

    @field_validator('address')
    @classmethod
    def validate_address(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if len(cleaned) < 5:
                raise ValueError("Street address must be at least 5 characters long.")
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

    @field_validator('hourly_rate')
    @classmethod
    def validate_hourly_rate(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Hourly rate must be greater than 0.")
        return v

    @field_validator('experience')
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 60):
            raise ValueError("Years of experience must be between 0 and 60.")
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if len(cleaned) < 10:
                raise ValueError("Business description must be at least 10 characters long.")
            return cleaned
        return v


class UserSettingsUpdate(BaseModel):
    language: Optional[str] = None
    currency: Optional[str] = None
    compact_view: Optional[bool] = None
    email_bookings: Optional[bool] = None
    email_promotions: Optional[bool] = None
    push_bookings: Optional[bool] = None
    push_updates: Optional[bool] = None
    sms_alerts: Optional[bool] = None
    login_alerts: Optional[bool] = None