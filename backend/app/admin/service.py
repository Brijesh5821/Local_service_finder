from app.admin import repository
from app.notifications.service import create_notification

def get_users() -> list:
    return repository.get_users()

def get_user_details(user_id: str) -> dict:
    return repository.get_user_details(user_id)

def update_user_status(user_id: str, status: str = None, is_active: bool = None) -> dict:
    result = repository.update_user_status(user_id, status, is_active)
    # Notify user about status change
    if result and status:
        if status == "active":
            create_notification(
                user_id=user_id,
                title="Account Activated",
                message="Your account has been activated by an administrator.",
                notification_type="ACCOUNT_ACTIVATED"
            )
        elif status == "suspended":
            create_notification(
                user_id=user_id,
                title="Account Suspended",
                message="Your account has been suspended by an administrator. Please contact support for more information.",
                notification_type="ACCOUNT_SUSPENDED"
            )
    return result

def approve_user(user_id: str, admin_id: str) -> dict:
    result = repository.approve_user(user_id, admin_id)
    if result:
        create_notification(
            user_id=user_id,
            title="Account Approved",
            message="Your account has been approved! You can now log in and start using the platform.",
            notification_type="ACCOUNT_APPROVED"
        )
    return result

def reject_user(user_id: str, admin_id: str, rejection_reason: str = None) -> dict:
    result = repository.reject_user(user_id, admin_id, rejection_reason)
    if result:
        msg = "Your account registration has been rejected by an administrator."
        if rejection_reason:
            msg += f" Reason: {rejection_reason}"
        create_notification(
            user_id=user_id,
            title="Account Rejected",
            message=msg,
            notification_type="ACCOUNT_REJECTED"
        )
    return result

def delete_user_safely(user_id: str) -> dict:
    return repository.delete_user_safely(user_id)


def get_bookings() -> list:
    return repository.get_bookings()

def update_booking_status(booking_id: str, booking_status: str, payment_status: str = None) -> dict:
    return repository.update_booking_status(booking_id, booking_status, payment_status)

def get_services() -> list:
    return repository.get_services()

def delete_service(service_id: str) -> bool:
    return repository.delete_service(service_id)

def approve_service(service_id: str) -> dict:
    result = repository.approve_service(service_id)
    if result:
        # Notify the provider who owns the service
        provider_id = result.get("provider_id")
        service_title = result.get("title", "your service")
        if provider_id:
            create_notification(
                user_id=str(provider_id),
                title="Service Approved",
                message=f"Your service '{service_title}' has been approved and is now live on the platform.",
                notification_type="SERVICE_APPROVED"
            )
    return result

def reject_service(service_id: str, reason: str = None) -> dict:
    result = repository.reject_service(service_id, reason)
    if result:
        provider_id = result.get("provider_id")
        service_title = result.get("title", "your service")
        if provider_id:
            msg = f"Your service '{service_title}' has been rejected by an administrator."
            if reason:
                msg += f" Reason: {reason}"
            create_notification(
                user_id=str(provider_id),
                title="Service Rejected",
                message=msg,
                notification_type="SERVICE_REJECTED"
            )
    return result

def get_dashboard_stats() -> dict:
    return repository.get_stats()

def get_categories() -> list:
    return repository.get_categories()

def get_public_categories() -> list:
    return repository.get_public_categories()

def create_category(data: dict) -> dict:
    return repository.create_category(data)

def update_category(category_id: str, data: dict) -> dict:
    return repository.update_category(category_id, data)

def delete_category(category_id: str) -> dict:
    return repository.delete_category(category_id)

def toggle_category_status(category_id: str, is_active: bool) -> dict:
    return repository.toggle_category_status(category_id, is_active)
