from pydantic import BaseModel, EmailStr
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