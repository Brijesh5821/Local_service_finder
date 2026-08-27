from app.bookings import service

def create_booking(customer_id: str, booking_data: dict):
    return service.create_booking(customer_id, booking_data)

def get_my_bookings(customer_id: str):
    return service.get_my_bookings(customer_id)

def cancel_booking(booking_id: str, customer_id: str) -> bool:
    return service.cancel_booking(booking_id, customer_id)

def request_reschedule_booking(booking_id: str, customer_id: str, date: str, time: str, reason: str = None) -> bool:
    return service.request_reschedule_booking(booking_id, customer_id, date, time, reason)

def accept_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    return service.accept_reschedule_booking(booking_id, provider_id)

def reject_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    return service.reject_reschedule_booking(booking_id, provider_id)
