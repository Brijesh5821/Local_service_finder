from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any

class UserStatusUpdate(BaseModel):
    status: Optional[str] = Field(None, description="User status e.g. active, suspended")
    is_active: Optional[bool] = Field(None, description="Whether user account is active")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip().lower()
            allowed = ["active", "suspended", "pending", "approved", "rejected"]
            if cleaned not in allowed:
                raise ValueError("Invalid status value.")
            return cleaned
        return v


class BookingStatusUpdate(BaseModel):
    booking_status: str = Field(..., description="Target status: Pending, Accepted, Completed, Cancelled, Rejected")
    payment_status: Optional[str] = Field(None, description="Target payment status: Pending, Completed, Failed")

    @field_validator('booking_status')
    @classmethod
    def validate_booking_status(cls, v: str) -> str:
        cleaned = v.strip().capitalize()
        allowed = ["Pending", "Accepted", "Completed", "Cancelled", "Rejected"]
        if cleaned not in allowed:
            raise ValueError("Invalid booking status.")
        return cleaned


class AdminDashboardStats(BaseModel):
    total_users: int
    total_providers: int
    total_services: int
    total_bookings: int
    total_earnings: float
    bookings_by_status: Dict[str, int]
    users_by_role: Dict[str, int]


class RejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=2, max_length=500)

    @field_validator('rejection_reason')
    @classmethod
    def validate_reason(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Rejection reason cannot be empty or whitespace only.")
        return cleaned


class CategoryCreate(BaseModel):
    category_name: str = Field(..., min_length=2, max_length=60)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = True

    @field_validator('category_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Category name must be at least 2 characters long.")
        return cleaned


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=2, max_length=60)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('category_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Category name must be at least 2 characters long.")
            return cleaned
        return v


class CategoryToggle(BaseModel):
    is_active: bool


class ServiceRejectRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)
