from app.reviews import repository
from app.database.connection import db
from bson import ObjectId
from fastapi import HTTPException

bookings_collection = db["bookings"]
users_collection = db["users"]

def add_review(customer_id: str, review_data: dict) -> dict:
    booking_id = review_data["booking_id"]
    
    # 1. Fetch booking to validate
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    # 2. Check ownership
    if str(booking.get("customer_id")) != customer_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only review bookings you created.")
        
    # 3. Check status is Completed
    if booking.get("booking_status") != "Completed":
        raise HTTPException(status_code=400, detail="Only completed bookings can be reviewed.")
        
    # 4. Check if already reviewed
    existing_review = repository.get_review_by_booking(booking_id)
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this booking.")
        
    # 5. Fetch customer name
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    customer_name = customer.get("full_name", "A Customer") if customer else "A Customer"
    
    # 6. Prepare review document
    provider_id = str(booking.get("provider_id"))
    service_id = str(booking.get("service_id")) if booking.get("service_id") else None
    
    review_doc = {
        "booking_id": booking_id,
        "provider_id": provider_id,
        "service_id": service_id,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "rating": int(review_data["rating"]),
        "review_text": review_data["review_text"]
    }
    
    # 7. Insert review
    review_id = repository.create_review(review_doc)
    review_doc["_id"] = review_id
    
    # 8. Recalculate average rating & update provider & services
    avg_rating, total_reviews = repository.get_average_rating_and_count(provider_id)
    repository.update_provider_rating(provider_id, avg_rating, total_reviews)
    
    return review_doc

def get_reviews_by_provider(provider_id: str) -> list:
    return repository.get_reviews_by_provider(provider_id)

def get_review_by_booking(booking_id: str) -> dict:
    return repository.get_review_by_booking(booking_id)
