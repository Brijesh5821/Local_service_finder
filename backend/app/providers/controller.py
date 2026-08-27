# Import providers service methods for business operations logic
from app.providers import service

# Forward request to service layer to retrieve dashboard statistics
def get_provider_dashboard_stats(provider_id: str) -> dict:
    # Call service method to aggregate counts and earnings
    return service.get_provider_dashboard_stats(provider_id)

# Forward request to service layer to list provider bookings
def get_provider_bookings(provider_id: str) -> list:
    # Call service method to query provider's bookings
    return service.get_provider_bookings(provider_id)

# Forward request to service layer to get booking details by ID
def get_provider_booking_by_id(booking_id: str, provider_id: str) -> dict:
    # Call service method to look up a specific booking
    return service.get_provider_booking_by_id(booking_id, provider_id)

# Forward request to service layer to accept a pending booking
def accept_booking(booking_id: str, provider_id: str) -> dict:
    # Call service method to change booking status to Accepted
    return service.accept_booking(booking_id, provider_id)

# Forward request to service to reject a pending booking with a reason
def reject_booking(booking_id: str, provider_id: str, reason: str = None) -> dict:
    # Call service method to reject booking and save optional reason
    return service.reject_booking(booking_id, provider_id, reason)

# Forward request to service to cancel an accepted booking with a reason
def cancel_booking(booking_id: str, provider_id: str, reason: str = None) -> dict:
    # Call service method to cancel booking and notify user
    return service.cancel_booking(booking_id, provider_id, reason)

# Forward request to service to mark a booking as completed
def complete_booking(booking_id: str, provider_id: str) -> dict:
    # Call service method to update booking state to Completed
    return service.complete_booking(booking_id, provider_id)

# Forward request to service to fetch all provider services
def get_provider_services(provider_id: str) -> list:
    # Call service method to list services
    return service.get_provider_services(provider_id)

# Forward request to service to create a new service
def create_provider_service(provider_id: str, data: dict) -> dict:
    # Call service method to construct and save new service
    return service.create_provider_service(provider_id, data)

# Forward request to service to edit an existing service
def update_provider_service(service_id: str, provider_id: str, data: dict) -> dict:
    # Call service method to execute edits on matching service ID
    return service.update_provider_service(service_id, provider_id, data)

# Forward request to service to delete a service
def delete_provider_service(service_id: str, provider_id: str) -> bool:
    # Call service method to delete the matching service
    return service.delete_provider_service(service_id, provider_id)

# Forward request to get all providers (existing search API)
def get_providers(name=None, category=None, city=None,
                  min_price=None, max_price=None, min_rating=None, availability=None,
                  lat=None, lng=None, radius=10.0, sort_by=None, page=1, limit=10):
    # Call service method to query provider search results
    return service.get_providers(name, category, city, min_price, max_price, min_rating, availability, lat, lng, radius, sort_by, page, limit)

# Forward request to get provider details by ID (existing search API)
def get_provider_by_id(provider_id: str):
    # Call service method to retrieve profile details
    return service.get_provider_by_id(provider_id)

def accept_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    from app.bookings import service as bookings_service
    return bookings_service.accept_reschedule_booking(booking_id, provider_id)

def reject_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    from app.bookings import service as bookings_service
    return bookings_service.reject_reschedule_booking(booking_id, provider_id)
