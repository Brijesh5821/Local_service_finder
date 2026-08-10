from app.database.connection import db
from bson import ObjectId

services_collection = db["services"]

def get_services(name: str = None, category: str = None, city: str = None,
                 min_price: float = None, max_price: float = None,
                 min_rating: float = None, availability: str = None,
                 q: str = None):
    query = {"status": "active"}

    if category:
        query["category_name"] = {"$regex": category, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    # Handle price filtering
    # Note: price_value is numeric, whereas price is string (e.g. "$", "$$")
    if min_price is not None:
        query.setdefault("price_value", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price_value", {})["$lte"] = max_price

    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}

    if availability:
        # Check if provider is available on this weekday
        day_key = f"availability.{availability.lower()}"
        query[day_key] = {"$exists": True, "$ne": [], "$not": {"$size": 0}}
    
    # Global search (name or q)
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category_name": {"$regex": q, "$options": "i"}},
            {"provider_name": {"$regex": q, "$options": "i"}}
        ]
    elif name:
        query["title"] = {"$regex": name, "$options": "i"}

    services = list(services_collection.find(query))
    for s in services:
        s["_id"] = str(s["_id"])
    return services

def get_service_by_id(service_id: str):
    try:
        service = services_collection.find_one({"_id": ObjectId(service_id)})
        if service:
            service["_id"] = str(service["_id"])
        return service
    except Exception:
        return None
