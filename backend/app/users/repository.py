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
        # If latitude/longitude is changed, compute location GeoJSON Point
        if "latitude" in filtered_data or "longitude" in filtered_data:
            user = users_collection.find_one({"_id": ObjectId(user_id)}) or {}
            lat = filtered_data.get("latitude") if filtered_data.get("latitude") is not None else user.get("latitude")
            lng = filtered_data.get("longitude") if filtered_data.get("longitude") is not None else user.get("longitude")
            if lat is not None and lng is not None:
                filtered_data["location"] = {
                    "type": "Point",
                    "coordinates": [float(lng), float(lat)]
                }

        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": filtered_data}
        )

        # Sync services coordinates and service area if it's a provider
        user_after = users_collection.find_one({"_id": ObjectId(user_id)}) or {}
        if user_after.get("role") == "Provider" and "location" in filtered_data:
            services_collection = db["services"]
            services_collection.update_many(
                {"provider_id": user_id},
                {"$set": {
                    "location": filtered_data["location"],
                    "latitude": filtered_data.get("latitude"),
                    "longitude": filtered_data.get("longitude"),
                    "city": user_after.get("city"),
                    "service_radius": user_after.get("service_radius")
                }}
            )

    return get_user_by_id(user_id)


def update_user_settings(user_id: str, settings_data: dict):
    # Retrieve current user document to get existing preferences
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {}
    current_prefs = user.get("preferences", {}) or {}
    
    # Merge existing preferences with new settings update
    new_prefs = {**current_prefs, **settings_data}
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferences": new_prefs}}
    )
    return new_prefs