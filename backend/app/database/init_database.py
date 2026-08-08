from datetime import datetime
from pymongo import ASCENDING
from app.database.connection import db

def initialize_database():
    # 1. Ensure all required collections exist
    required_collections = [
        "users",
        "categories",
        "services",
        "bookings",
        "reviews",
        "payments",
        "notifications"
    ]
    
    existing_collections = db.list_collection_names()
    for col in required_collections:
        if col not in existing_collections:
            db.create_collection(col)

    # 2. Create recommended indexes automatically
    # users indexes
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("phone", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])
    db.users.create_index([("provider_category", ASCENDING)])

    # services indexes
    db.services.create_index([("provider_id", ASCENDING)])
    db.services.create_index([("category_id", ASCENDING)])
    db.services.create_index([("status", ASCENDING)])

    # bookings indexes
    db.bookings.create_index([("customer_id", ASCENDING)])
    db.bookings.create_index([("provider_id", ASCENDING)])
    db.bookings.create_index([("service_id", ASCENDING)])
    db.bookings.create_index([("booking_status", ASCENDING)])

    # reviews indexes
    db.reviews.create_index([("provider_id", ASCENDING)])
    db.reviews.create_index([("service_id", ASCENDING)])

    # payments indexes
    db.payments.create_index([("booking_id", ASCENDING)])
    db.payments.create_index([("payment_status", ASCENDING)])

    # 3. Insert default categories if they do not already exist
    default_categories = [
        "Plumber",
        "Electrician",
        "Painter",
        "Carpenter",
        "Cleaning",
        "AC Repair",
        "Beautician",
        "Appliance Repair",
        "Home Tutor",
        "Mechanic",
        "Photographer",
        "Driver",
        "Gardener",
        "Cook",
        "Pest Control",
        "Laptop Repair",
        "Mobile Repair",
        "RO Water Purifier",
        "Interior Designer",
        "Packers & Movers"
    ]

    for cat_name in default_categories:
        if not db.categories.find_one({"category_name": cat_name}):
            db.categories.insert_one({
                "category_name": cat_name,
                "icon": cat_name.lower().replace(" ", "_").replace("&", "and"),
                "image": f"https://placeholder.localfinder.com/categories/{cat_name.lower().replace(' ', '_').replace('&', 'and')}.jpg",
                "description": f"Professional {cat_name} services",
                "is_active": True,
                "created_at": datetime.utcnow()
            })
