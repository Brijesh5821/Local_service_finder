from app.database.connection import db

users_collection = db["users"]


def get_users():
    users = list(users_collection.find({}, {"_id": 0}))
    return users