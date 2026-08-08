from pydantic import BaseModel
from typing import Optional


class BookingCreate(BaseModel):
    provider_id: str
    service_id: Optional[str] = None
    booking_date: str          # ISO date string e.g. "2026-08-15"
    booking_time: str          # e.g. "10:00"
    booking_address: str
    notes: Optional[str] = None
    total_amount: Optional[float] = 0.0
