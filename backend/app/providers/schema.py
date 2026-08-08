from pydantic import BaseModel
from typing import Optional, Dict, List


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
