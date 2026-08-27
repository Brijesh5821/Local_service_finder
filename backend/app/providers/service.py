# Import providers repository functions for database operations
from app.providers import repository
# Import exception class to raise error responses
from fastapi import HTTPException
# Import db connection to perform auxiliary lookups
from app.database.connection import db
# Import ObjectId to parse string IDs
from bson import ObjectId
# Import timestamp generation helper
from datetime import datetime
# Import notification creator function to trigger updates for the user
from app.notifications.service import create_notification

# Reference the users collection in database
users_collection = db["users"]
# Reference the services collection in database
services_collection = db["services"]

# Service function to query provider users list with search filters (existing API)
def get_providers(name=None, category=None, city=None,
                  min_price=None, max_price=None, min_rating=None, availability=None,
                  lat=None, lng=None, radius=10.0, sort_by=None, page=1, limit=10):
    # Delegate provider users lookup to database repository layer
    return repository.get_providers(name, category, city, min_price, max_price, min_rating, availability, lat, lng, radius, sort_by, page, limit)

# Service function to find provider details by ID (existing API)
def get_provider_by_id(provider_id: str):
    # Delegate specific provider user retrieval to repository layer
    return repository.get_provider_by_id(provider_id)

# Service function to fetch dashboard stats
def get_provider_dashboard_stats(provider_id: str) -> dict:
    # Query repository for count aggregated statistics
    return repository.get_provider_dashboard_stats(provider_id)

# Service function to list provider bookings
def get_provider_bookings(provider_id: str) -> list:
    # Query repository for bookings list
    bookings = repository.get_provider_bookings(provider_id)
    # Loop to enrich booking objects with customer profile details
    for b in bookings:
        # Get customer ID string from booking
        customer_id = b.get("customer_id")
        # Check if customer ID exists
        if customer_id:
            # Query user database for customer name and phone number
            customer = users_collection.find_one(
                # Find matching user document
                {"_id": ObjectId(customer_id)},
                # Project name and phone number fields only
                {"full_name": 1, "phone": 1, "_id": 0}
            )
            # Check if customer document exists
            if customer:
                # Set customer name on booking object
                b["customer_name"] = customer.get("full_name", "Unknown")
                # Set customer phone on booking object
                b["customer_phone"] = customer.get("phone", "")
        
        # Get service ID string from booking
        service_id = b.get("service_id")
        # Check if service ID exists
        if service_id:
            # Query services database for service details
            service = services_collection.find_one(
                # Find matching service document
                {"_id": ObjectId(service_id)},
                # Project service title and category name
                {"title": 1, "category_name": 1, "_id": 0}
            )
            # Check if service document exists
            if service:
                # Set service name on booking object
                b["service_name"] = service.get("title", "Unknown Service")
                # Set service category on booking object
                b["service_category"] = service.get("category_name", "")
    # Return enriched bookings list
    return bookings

# Service function to fetch single provider booking details
def get_provider_booking_by_id(booking_id: str, provider_id: str) -> dict:
    # Query repository for booking details
    booking = repository.get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Return None if not found
        return None
    
    # Get customer ID from booking
    customer_id = booking.get("customer_id")
    # Check if customer ID exists
    if customer_id:
        # Fetch customer contact details
        customer = users_collection.find_one(
            # Query user database
            {"_id": ObjectId(customer_id)},
            # Return name and phone only
            {"full_name": 1, "phone": 1, "_id": 0}
        )
        # Check if customer exists
        if customer:
            # Set customer name
            booking["customer_name"] = customer.get("full_name", "Unknown")
            # Set customer phone
            booking["customer_phone"] = customer.get("phone", "")
            
    # Get service ID from booking
    service_id = booking.get("service_id")
    # Check if service ID exists
    if service_id:
        # Query service title and category
        service = services_collection.find_one(
            # Find matching service document
            {"_id": ObjectId(service_id)},
            # Select title and category fields
            {"title": 1, "category_name": 1, "_id": 0}
        )
        # Check if service exists
        if service:
            # Set service name
            booking["service_name"] = service.get("title", "Unknown Service")
            # Set service category
            booking["service_category"] = service.get("category_name", "")
            
    # Return enriched booking
    return booking

# Helper function to check and retrieve names for notification contents
def _get_notification_details(booking: dict) -> tuple:
    # Default service title placeholder
    service_title = "Service"
    # Query service record
    service_doc = services_collection.find_one({"_id": ObjectId(booking["service_id"])})
    # If service record was found
    if service_doc:
        # Retrieve service title
        service_title = service_doc.get("title", "Service")
    
    # Default provider name placeholder
    provider_name = "Provider"
    # Query provider user record
    provider_doc = users_collection.find_one({"_id": ObjectId(booking["provider_id"])})
    # If provider record was found
    if provider_doc:
        # Retrieve provider full name
        provider_name = provider_doc.get("full_name", "Provider")
        
    # Return service title and provider name tuple
    return service_title, provider_name

# Service function to accept a pending booking
def accept_booking(booking_id: str, provider_id: str) -> dict:
    # Retrieve booking details
    booking = get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Raise 404 error if booking doesn't exist or is not owned
        raise HTTPException(status_code=404, detail="Booking not found or access denied")
    
    # Verify current status is Pending
    if booking["booking_status"] != "Pending":
        # Raise 400 bad request error for invalid status transitions
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept booking in '{booking['booking_status']}' status. Only Pending bookings can be accepted."
        )
    
    # Update status to Accepted in DB
    updated_booking = repository.update_booking_status(booking_id, provider_id, "Accepted")
    
    # Lookup names for formatting notification text
    service_title, provider_name = _get_notification_details(booking)
    # Create notification for user
    create_notification(
        # Recipient is the customer who placed the booking
        user_id=booking["customer_id"],
        # Set message title
        title="Booking Accepted",
        # Write descriptive message string
        message=f"Your booking for {service_title} has been accepted by {provider_name}.",
        # Set type
        notification_type="BOOKING_ACCEPTED",
        # Set booking ID reference
        booking_id=booking_id
    )
    # Return the updated booking document
    return updated_booking

# Service function to reject a pending booking
def reject_booking(booking_id: str, provider_id: str, reason: str = None) -> dict:
    # Retrieve booking details
    booking = get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Raise 404 error if booking not found
        raise HTTPException(status_code=404, detail="Booking not found or access denied")
    
    # Verify status is Pending
    if booking["booking_status"] != "Pending":
        # Raise 400 error for invalid state transition
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject booking in '{booking['booking_status']}' status. Only Pending bookings can be rejected."
        )
    
    # Add optional rejection reason to document updates
    extra = {"rejection_reason": reason} if reason else {}
    # Update status to Rejected in DB
    updated_booking = repository.update_booking_status(booking_id, provider_id, "Rejected", extra)
    
    # Lookup notification context details
    service_title, provider_name = _get_notification_details(booking)
    # Build rejection message string
    msg = f"Your booking for {service_title} has been rejected by {provider_name}."
    # If a reason was entered, append it
    if reason:
        # Append reason text
        msg += f" Reason: {reason}"
        
    # Trigger notification send to client
    create_notification(
        # Client recipient ID
        user_id=booking["customer_id"],
        # Message title
        title="Booking Rejected",
        # Message body text
        message=msg,
        # Set type
        notification_type="BOOKING_REJECTED",
        # Set reference booking ID
        booking_id=booking_id
    )
    # Return updated document
    return updated_booking

# Service function to cancel an accepted booking
def cancel_booking(booking_id: str, provider_id: str, reason: str = None) -> dict:
    # Retrieve booking details
    booking = get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Raise 404 error if booking not found
        raise HTTPException(status_code=404, detail="Booking not found or access denied")
    
    # Verify current status is Accepted
    if booking["booking_status"] != "Accepted":
        # Raise 400 error for invalid cancellation transitions
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel booking in '{booking['booking_status']}' status. Only Accepted bookings can be cancelled."
        )
    
    # Add optional cancellation reason to document updates
    extra = {"cancellation_reason": reason} if reason else {}
    # Update status to Cancelled in DB
    updated_booking = repository.update_booking_status(booking_id, provider_id, "Cancelled", extra)
    
    # Lookup names for notifications
    service_title, provider_name = _get_notification_details(booking)
    # Build cancellation message string
    msg = f"Your booking for {service_title} has been cancelled by {provider_name}."
    # Append reason if available
    if reason:
        # Append reason text
        msg += f" Reason: {reason}"
        
    # Trigger notification to user
    create_notification(
        # Customer user ID
        user_id=booking["customer_id"],
        # Message title
        title="Booking Cancelled",
        # Message details
        message=msg,
        # Set type
        notification_type="BOOKING_CANCELLED",
        # Set booking ID reference
        booking_id=booking_id
    )
    # Return updated document
    return updated_booking

# Service function to complete an accepted booking
def complete_booking(booking_id: str, provider_id: str) -> dict:
    # Retrieve booking details
    booking = get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Raise 404 if booking not found
        raise HTTPException(status_code=404, detail="Booking not found or access denied")
    
    # Verify current status is Accepted
    if booking["booking_status"] != "Accepted":
        # Raise 400 error for invalid completion transitions
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete booking in '{booking['booking_status']}' status. Only Accepted bookings can be completed."
        )
    
    # Update status to Completed in DB
    updated_booking = repository.update_booking_status(booking_id, provider_id, "Completed")
    
    # Lookup names for message content
    service_title, provider_name = _get_notification_details(booking)
    # Trigger notification write to user
    create_notification(
        # Customer ID
        user_id=booking["customer_id"],
        # Message title
        title="Booking Completed",
        # Message details text
        message=f"Your booking for {service_title} with {provider_name} has been completed.",
        # Set type
        notification_type="BOOKING_COMPLETED",
        # Set booking ID reference
        booking_id=booking_id
    )
    # Return updated document
    return updated_booking

# Service function to fetch provider services list
def get_provider_services(provider_id: str) -> list:
    # Call repository layer to query services
    return repository.get_provider_services(provider_id)

# Service function to create a new provider service
def create_provider_service(provider_id: str, data: dict) -> dict:
    # Fetch provider user details to populate nested reference fields
    provider = users_collection.find_one({"_id": ObjectId(provider_id)})
    # Check if provider user document exists
    if not provider:
        # Raise 404 if provider is missing
        raise HTTPException(status_code=404, detail="Provider user not found")
        
    # Get provider full name or fall back to email / default value
    provider_name = provider.get("full_name", "Service Pro")
    # Get provider profile image
    provider_image = provider.get("profile_image", "")
    # Get provider availability config
    provider_availability = provider.get("availability")
    
    # Construct complete service document dictionary structure
    service_doc = {
        # Set service title field
        "title": data["title"],
        # Set description
        "description": data["description"],
        # Set category name
        "category_name": data["category_name"],
        # Set provider string ID
        "provider_id": provider_id,
        # Set provider name for search listing queries
        "provider_name": provider_name,
        # Set provider image URL
        "provider_image": provider_image,
        # Set price tier
        "price": data["price"],
        # Set price numeric value
        "price_value": float(data["price_value"]),
        # Set service status — new services await admin approval before going public
        "status": "pending_approval",
        # Set default rating for new services
        "average_rating": provider.get("average_rating") or 4.5,
        # Set city, fallback to provider's city if not specified
        "city": data.get("city") or provider.get("city") or "Surendranagar",
        # Copy weekly availability calendar mapping
        "availability": provider_availability,
        # Set creation timestamp
        "created_at": datetime.utcnow()
    }
    
    # Save the service document to database using repository call
    new_id = repository.create_service(service_doc)
    # Add string ID back to the return document representation
    service_doc["_id"] = new_id
    # Return created service details
    return service_doc

# Service function to update service details
def update_provider_service(service_id: str, provider_id: str, data: dict) -> dict:
    # Retrieve service document first to verify ownership
    service = repository.get_provider_service_by_id(service_id, provider_id)
    # Check if service exists
    if not service:
        # Raise 404 if not found or unauthorized
        raise HTTPException(status_code=404, detail="Service not found or access denied")
        
    # Build updated fields dict removing None values
    updates = {k: v for k, v in data.items() if v is not None}
    # Log update timestamp in changes dictionary
    updates["updated_at"] = datetime.utcnow()
    
    # Save edits to DB using repository layer call
    return repository.update_service(service_id, provider_id, updates)

# Service function to delete a service
def delete_provider_service(service_id: str, provider_id: str) -> bool:
    # Retrieve service document first to verify ownership
    service = repository.get_provider_service_by_id(service_id, provider_id)
    # Check if service exists
    if not service:
        # Raise 404 if not found
        raise HTTPException(status_code=404, detail="Service not found or access denied")
        
    # Call repository to delete document from database
    return repository.delete_service(service_id, provider_id)
