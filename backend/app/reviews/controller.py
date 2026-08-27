from app.reviews import service

def add_review(customer_id: str, review_data: dict) -> dict:
    return service.add_review(customer_id, review_data)

def get_reviews_by_provider(provider_id: str) -> list:
    return service.get_reviews_by_provider(provider_id)

def get_review_by_booking(booking_id: str) -> dict:
    return service.get_review_by_booking(booking_id)
