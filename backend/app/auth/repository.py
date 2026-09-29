from app.database.connection import db
from datetime import datetime

users_collection = db["users"]


def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})


def get_user_by_phone(phone: str):
    return users_collection.find_one({"phone": phone})


def get_user_by_google_sub(google_sub: str):
    return users_collection.find_one({
        "$or": [
            {"google_sub": google_sub},
            {"google_id": google_sub}
        ]
    })


def get_user_by_id(user_id):
    from bson import ObjectId
    try:
        if isinstance(user_id, str):
            return users_collection.find_one({"_id": ObjectId(user_id)})
        return users_collection.find_one({"_id": user_id})
    except Exception:
        return users_collection.find_one({"_id": user_id})


def update_user_google_info(user_id, updates: dict):
    return users_collection.update_one({"_id": user_id}, {"$set": updates})


def create_user(user_data: dict):
    user_data["created_at"] = datetime.utcnow()
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)