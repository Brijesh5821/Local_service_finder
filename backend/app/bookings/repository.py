from app.database.connection import db
from bson import ObjectId
from datetime import datetime


bookings_collection = db["bookings"]


def create_booking(booking_doc: dict) -> str:
    result = bookings_collection.insert_one(booking_doc)
    return str(result.inserted_id)


def get_bookings_by_customer(customer_id: str) -> list:
    bookings = list(bookings_collection.find({"customer_id": customer_id}))
    for b in bookings:
        b["_id"] = str(b["_id"])
    return bookings


def cancel_booking(booking_id: str, customer_id: str) -> bool:
    """Cancel a booking only if it belongs to the customer and is still Pending."""
    result = bookings_collection.update_one(
        {
            "_id": ObjectId(booking_id),
            "customer_id": customer_id,
            "booking_status": "Pending"
        },
        {"$set": {"booking_status": "Cancelled", "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0
