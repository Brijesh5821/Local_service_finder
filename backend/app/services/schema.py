from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ServiceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    category_name: str
    provider_id: str
    provider_name: str
    provider_image: Optional[str] = None
    price: str
    price_value: float
    status: str
    average_rating: Optional[float] = 0.0
    city: Optional[str] = None
    availability: Optional[Dict[str, List[str]]] = None
