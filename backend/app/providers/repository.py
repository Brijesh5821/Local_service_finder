from app.database.connection import db
from bson import ObjectId


users_collection = db["users"]


def get_providers(name: str = None, category: str = None, city: str = None,
                  min_price: float = None, max_price: float = None,
                  min_rating: float = None, availability: str = None):
    query = {"role": {"$in": ["Provider", "provider"]}}

    if name:
        query["full_name"] = {"$regex": name, "$options": "i"}
    if category:
        query["provider_category"] = {"$regex": category, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price is not None:
        query.setdefault("hourly_rate", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("hourly_rate", {})["$lte"] = max_price
    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}

    providers = list(users_collection.find(query, {"password": 0}))
    for p in providers:
        p["_id"] = str(p["_id"])
    return providers


def get_provider_by_id(provider_id: str):
    provider = users_collection.find_one(
        {"_id": ObjectId(provider_id), "role": {"$in": ["Provider", "provider"]}},
        {"password": 0}
    )
    if provider:
        provider["_id"] = str(provider["_id"])
    return provider
