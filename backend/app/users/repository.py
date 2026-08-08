from app.database.connection import db
from bson import ObjectId

users_collection = db["users"]


def get_users():
    users = list(users_collection.find({}, {"_id": 0}))
    return users


def get_user_by_id(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
    return user


def update_user_by_id(user_id: str, update_data: dict):
    # Remove None values so we update only modified fields
    filtered_data = {k: v for k, v in update_data.items() if v is not None}
    filtered_data.pop("id", None)
    filtered_data.pop("_id", None)
    filtered_data.pop("role", None)
    filtered_data.pop("password", None)

    if filtered_data:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": filtered_data}
        )
    return get_user_by_id(user_id)