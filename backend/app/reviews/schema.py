from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: str = Field(..., min_length=3, max_length=1000)

class ReviewResponse(BaseModel):
    id: str
    booking_id: str
    provider_id: str
    service_id: Optional[str] = None
    customer_id: str
    customer_name: str
    rating: int
    review_text: str
    created_at: datetime
