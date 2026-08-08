from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6)
    role: str = "User" # User, Provider, Admin
    
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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str