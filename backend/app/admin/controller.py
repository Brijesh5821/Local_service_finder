from app.admin import service

def get_users() -> list:
    return service.get_users()

def get_user_details(user_id: str) -> dict:
    return service.get_user_details(user_id)

def update_user_status(user_id: str, status: str = None, is_active: bool = None) -> dict:
    return service.update_user_status(user_id, status, is_active)

def approve_user(user_id: str, admin_id: str) -> dict:
    return service.approve_user(user_id, admin_id)

def reject_user(user_id: str, admin_id: str, rejection_reason: str = None) -> dict:
    return service.reject_user(user_id, admin_id, rejection_reason)

def delete_user_safely(user_id: str) -> dict:
    return service.delete_user_safely(user_id)


def get_bookings() -> list:
    return service.get_bookings()

def update_booking_status(booking_id: str, booking_status: str, payment_status: str = None) -> dict:
    return service.update_booking_status(booking_id, booking_status, payment_status)

def get_services() -> list:
    return service.get_services()

def delete_service(service_id: str) -> bool:
    return service.delete_service(service_id)

def approve_service(service_id: str) -> dict:
    return service.approve_service(service_id)

def reject_service(service_id: str, reason: str = None) -> dict:
    return service.reject_service(service_id, reason)

def get_dashboard_stats() -> dict:
    return service.get_dashboard_stats()

def get_categories() -> list:
    return service.get_categories()

def get_public_categories() -> list:
    return service.get_public_categories()

def create_category(data: dict) -> dict:
    return service.create_category(data)

def update_category(category_id: str, data: dict) -> dict:
    return service.update_category(category_id, data)

def delete_category(category_id: str) -> dict:
    return service.delete_category(category_id)

def toggle_category_status(category_id: str, is_active: bool) -> dict:
    return service.toggle_category_status(category_id, is_active)
