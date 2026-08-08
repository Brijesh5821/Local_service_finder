from app.bookings import service


def create_booking(customer_id: str, booking_data: dict):
    return service.create_booking(customer_id, booking_data)


def get_my_bookings(customer_id: str):
    return service.get_my_bookings(customer_id)


def cancel_booking(booking_id: str, customer_id: str):
    return service.cancel_booking(booking_id, customer_id)
