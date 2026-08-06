from app.database.connection import db
from datetime import datetime

users_collection = db["users"]


def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})


def create_user(user_data: dict):
    user_data["created_at"] = datetime.utcnow()
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)