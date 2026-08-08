from app.bookings import repository
from app.database.connection import db
from bson import ObjectId
from datetime import datetime


users_collection = db["users"]


def create_booking(customer_id: str, booking_data: dict) -> dict:
    # Fetch provider info for reference
    provider_id = booking_data.get("provider_id")
    provider = None
    if provider_id:
        try:
            provider = users_collection.find_one({"_id": ObjectId(provider_id)}, {"hourly_rate": 1})
        except Exception:
            pass

    doc = {
        "customer_id": customer_id,
        "provider_id": provider_id,
        "service_id": booking_data.get("service_id"),
        "booking_date": booking_data.get("booking_date"),
        "booking_time": booking_data.get("booking_time"),
        "booking_address": booking_data.get("booking_address"),
        "notes": booking_data.get("notes", ""),
        "booking_status": "Pending",
        "payment_status": "Pending",
        "total_amount": booking_data.get("total_amount", 0.0),
        "created_at": datetime.utcnow(),
    }

    booking_id = repository.create_booking(doc)
    doc["_id"] = booking_id
    return doc


def get_my_bookings(customer_id: str) -> list:
    bookings = repository.get_bookings_by_customer(customer_id)
    # Enrich with provider info
    enriched = []
    for b in bookings:
        provider_id = b.get("provider_id")
        if provider_id:
            try:
                provider = users_collection.find_one(
                    {"_id": ObjectId(provider_id)},
                    {"full_name": 1, "provider_category": 1, "profile_image": 1, "_id": 0}
                )
                if provider:
                    b["provider_name"] = provider.get("full_name", "Unknown")
                    b["provider_category"] = provider.get("provider_category", "")
                    b["provider_image"] = provider.get("profile_image", "")
            except Exception:
                pass
        enriched.append(b)
    return enriched


def cancel_booking(booking_id: str, customer_id: str) -> bool:
    return repository.cancel_booking(booking_id, customer_id)
