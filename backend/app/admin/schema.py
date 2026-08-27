from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserStatusUpdate(BaseModel):
    status: Optional[str] = Field(None, description="User status e.g. active, suspended")
    is_active: Optional[bool] = Field(None, description="Whether user account is active")

class BookingStatusUpdate(BaseModel):
    booking_status: str = Field(..., description="Target status: Pending, Accepted, Completed, Cancelled, Rejected")
    payment_status: Optional[str] = Field(None, description="Target payment status: Pending, Completed, Failed")

class AdminDashboardStats(BaseModel):
    total_users: int
    total_providers: int
    total_services: int
    total_bookings: int
    total_earnings: float
    bookings_by_status: Dict[str, int]
    users_by_role: Dict[str, int]

class RejectRequest(BaseModel):
    rejection_reason: str

class CategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = True

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryToggle(BaseModel):
    is_active: bool

class ServiceRejectRequest(BaseModel):
    reason: Optional[str] = None
