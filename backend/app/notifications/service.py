# Import notifications repository methods for database operations
from app.notifications import repository
# Import datetime to set notification creation timestamps
from datetime import datetime

# Service function to fetch notifications for a specific user
def get_notifications(user_id: str) -> list:
    # Delegate query operation to the notification repository layer
    return repository.get_notifications(user_id)

# Service function to mark a specific notification as read
def mark_as_read(notification_id: str, user_id: str) -> bool:
    # Delegate database update operation to the notification repository layer
    return repository.mark_as_read(notification_id, user_id)

# Service function to create and persist a new notification document
def create_notification(user_id: str, title: str, message: str, notification_type: str, booking_id: str) -> str:
    # Build dictionary payload containing notification schema fields
    doc = {
        # Recipient ID of the notification
        "user_id": user_id,
        # Title of the notification message
        "title": title,
        # Content body details of the notification
        "message": message,
        # Identifier of notification event (e.g. BOOKING_ACCEPTED)
        "notification_type": notification_type,
        # Booking reference string associated with the notification
        "booking_id": booking_id,
        # Mark read status initial value as false
        "is_read": False,
        # Set timestamp field as current UTC date and time
        "created_at": datetime.utcnow()
    }
    # Persist document to database using repository call and return string ID
    return repository.create_notification(doc)
