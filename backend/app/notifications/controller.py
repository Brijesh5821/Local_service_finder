# Import notifications service methods for handling business operations
from app.notifications import service

# Controller function to get list of notifications for a user
def get_notifications(user_id: str) -> list:
    # Forward the retrieval request to notifications service
    return service.get_notifications(user_id)

# Controller function to mark a specific user notification as read
def mark_as_read(notification_id: str, user_id: str) -> bool:
    # Forward update status request to notifications service
    return service.mark_as_read(notification_id, user_id)
