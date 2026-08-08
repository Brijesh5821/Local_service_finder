from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
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