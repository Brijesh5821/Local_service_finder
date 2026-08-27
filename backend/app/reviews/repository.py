from app.database.connection import db
from bson import ObjectId
from datetime import datetime

reviews_collection = db["reviews"]
users_collection = db["users"]
services_collection = db["services"]

def create_review(review_doc: dict) -> str:
    review_doc["created_at"] = datetime.utcnow()
    result = reviews_collection.insert_one(review_doc)
    return str(result.inserted_id)

def get_reviews_by_provider(provider_id: str) -> list:
    reviews = list(reviews_collection.find({"provider_id": provider_id}).sort("created_at", -1))
    for r in reviews:
        r["_id"] = str(r["_id"])
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return reviews

def get_review_by_booking(booking_id: str) -> dict:
    r = reviews_collection.find_one({"booking_id": booking_id})
    if r:
        r["_id"] = str(r["_id"])
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return r

def get_average_rating_and_count(provider_id: str) -> tuple:
    pipeline = [
        {"$match": {"provider_id": provider_id}},
        {"$group": {
            "_id": "$provider_id",
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    res = list(reviews_collection.aggregate(pipeline))
    if res:
        return round(float(res[0]["avg_rating"]), 2), int(res[0]["total_reviews"])
    return 4.5, 0

def update_provider_rating(provider_id: str, average_rating: float, total_reviews: int):
    # Update provider user doc
    users_collection.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"average_rating": average_rating, "total_reviews": total_reviews}}
    )
    # Update services collection matching provider_id
    services_collection.update_many(
        {"provider_id": provider_id},
        {"$set": {"average_rating": average_rating, "total_reviews": total_reviews}}
    )
