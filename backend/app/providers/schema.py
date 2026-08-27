# Import BaseModel, Field, and field_validator from pydantic
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, List, Any

# Define the ProviderResponse schema for serializing provider details
class ProviderResponse(BaseModel):
    id: Optional[str] = None
    full_name: str
    profile_image: Optional[str] = None
    provider_category: Optional[str] = None
    experience: Optional[int] = None
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    average_rating: Optional[float] = None
    city: Optional[str] = None
    availability: Optional[Dict[str, List[str]]] = None


# Define the ServiceCreateRequest schema for adding a new service
class ServiceCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=10, max_length=2000)
    category_name: str = Field(..., min_length=2, max_length=60)
    price: str = Field("$$", min_length=1, max_length=10)
    price_value: float = Field(..., gt=0.0, le=100000.0)
    status: Optional[str] = "active"
    city: Optional[str] = Field(None, max_length=100)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 3:
            raise ValueError("Service title must be at least 3 characters long.")
        return cleaned

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 10:
            raise ValueError("Service description must be at least 10 characters long.")
        return cleaned

    @field_validator('category_name')
    @classmethod
    def validate_category(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Category name is required.")
        return cleaned


# Define the ServiceUpdateRequest schema for editing an existing service
class ServiceUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=120)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    category_name: Optional[str] = Field(None, min_length=2, max_length=60)
    price: Optional[str] = Field(None, min_length=1, max_length=10)
    price_value: Optional[float] = Field(None, gt=0.0, le=100000.0)
    status: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 3:
                raise ValueError("Service title must be at least 3 characters long.")
            return cleaned
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 10:
                raise ValueError("Service description must be at least 10 characters long.")
            return cleaned
        return v


# Define the BookingStatusUpdateRequest schema for reject/cancel status updates
class BookingStatusUpdateRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)
