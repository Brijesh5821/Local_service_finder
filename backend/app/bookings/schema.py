import re
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class BookingCreate(BaseModel):
    provider_id: str = Field(..., min_length=1)
    service_id: Optional[str] = None
    booking_date: str = Field(..., description="ISO date string e.g. 'YYYY-MM-DD'")
    booking_time: str = Field(..., min_length=2, max_length=30)
    booking_address: str = Field(..., min_length=5, max_length=300)
    notes: Optional[str] = Field(None, max_length=1000)
    total_amount: Optional[float] = 0.0

    @field_validator('booking_date')
    @classmethod
    def validate_booking_date(cls, v: str) -> str:
        cleaned = v.strip()
        try:
            parsed_date = datetime.strptime(cleaned, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Booking date must be in YYYY-MM-DD format.")
        
        today = date.today()
        if parsed_date < today:
            raise ValueError("Booking date cannot be in the past.")
        return cleaned

    @field_validator('booking_address')
    @classmethod
    def validate_address(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 5:
            raise ValueError("Booking address must be at least 5 characters long.")
        return cleaned

    @field_validator('total_amount')
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Total amount cannot be negative.")
        return v


class BookingReschedule(BaseModel):
    booking_date: str
    booking_time: str
    reason: Optional[str] = Field(None, max_length=500)

    @field_validator('booking_date')
    @classmethod
    def validate_reschedule_date(cls, v: str) -> str:
        cleaned = v.strip()
        try:
            parsed_date = datetime.strptime(cleaned, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Reschedule date must be in YYYY-MM-DD format.")
        
        today = date.today()
        if parsed_date < today:
            raise ValueError("Rescheduled date cannot be in the past.")
        return cleaned
