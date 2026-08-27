# Import database connection object from database connection module
from app.database.connection import db
# Import ObjectId from bson to convert string ID to MongoDB format
from bson import ObjectId
# Import datetime for timestamp fields
from datetime import datetime

# Reference the notifications collection in MongoDB
notifications_collection = db["notifications"]

# Function to save a new notification document to MongoDB
def create_notification(notification_doc: dict) -> str:
    # Insert the document into the notifications collection
    result = notifications_collection.insert_one(notification_doc)
    # Return the string representation of the inserted object ID
    return str(result.inserted_id)

# Function to get notifications for a specific user ID
def get_notifications(user_id: str) -> list:
    # Query database for matching user_id and sort by creation timestamp descending
    cursor = notifications_collection.find({"user_id": user_id}).sort("created_at", -1)
    # Convert cursor to a list of dict documents
    notifications = list(cursor)
    # Loop through each notification document in the list
    for n in notifications:
        # Convert _id ObjectId field to a serializable string
        n["_id"] = str(n["_id"])
    # Return the list of processed notifications
    return notifications

# Function to mark a single notification as read
def mark_as_read(notification_id: str, user_id: str) -> bool:
    # Try to find and update notification status in database
    try:
        # Update the is_read status to True for matching ID and owner ID
        result = notifications_collection.update_one(
            # Filter condition to match ID and owner to prevent unauthorized updates
            {"_id": ObjectId(notification_id), "user_id": user_id},
            # Update operation to set is_read to True
            {"$set": {"is_read": True}}
        )
        # Return True if document was found and modified successfully
        return result.modified_count > 0
    # Catch any object ID parsing errors or DB exceptions
    except Exception:
        # Return False in case of errors
        return False
