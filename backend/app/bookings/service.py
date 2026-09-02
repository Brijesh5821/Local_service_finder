# Import bookings repository functions for database CRUD operations
from app.bookings import repository
# Import database connection object to perform lookups
from app.database.connection import db
# Import ObjectId from bson to parse document IDs
from bson import ObjectId
# Import datetime to log timestamps
from datetime import datetime
# Import notification creator function to write alerts
from app.notifications.service import create_notification

# Reference the users collection in database
users_collection = db["users"]
# Reference the services collection in database
services_collection = db["services"]
# Reference the bookings collection in database
bookings_collection = db["bookings"]

def validate_provider_availability(provider_id: str, booking_date: str, booking_time: str, customer_id: str, service_id: str = None) -> str:
    provider = users_collection.find_one({"_id": ObjectId(provider_id)})
    if not provider:
        return "Provider not found."
        
    account_status = provider.get("account_status", "pending")
    status = provider.get("status", "active")
    if account_status != "approved" or status != "active" or provider.get("is_active") is False:
        return "Provider is currently unavailable or inactive."
        
    holidays = provider.get("holidays") or []
    if booking_date in holidays:
        return f"Provider is on holiday/unavailable on {booking_date}."
        
    try:
        from datetime import datetime
        dt = datetime.strptime(booking_date, "%Y-%m-%d")
        weekday_name = dt.strftime("%A").lower()
        full_day_name = dt.strftime("%A")
    except Exception:
        return "Invalid booking date format. Use YYYY-MM-DD."
        
    # Check if a specific service is being booked with service-level availability
    service_avail = None
    if service_id:
        try:
            srv = services_collection.find_one({"_id": ObjectId(service_id)})
            if srv and srv.get("availability"):
                service_avail = srv.get("availability")
        except Exception:
            pass

    time_slot_valid = False

    try:
        booking_minutes = int(booking_time.split(":")[0]) * 60 + int(booking_time.split(":")[1])
    except Exception:
        return "Invalid booking time format. Use HH:MM."

    if service_avail and isinstance(service_avail, list) and len(service_avail) > 0:
        # Service availability is configured as a list of day objects
        day_config = next((d for d in service_avail if isinstance(d, dict) and d.get("day", "").lower() == weekday_name), None)
        if not day_config or not day_config.get("slots"):
            return f"Service is not offered on {full_day_name}s."
            
        for slot in day_config.get("slots", []):
            if isinstance(slot, dict):
                start_str = slot.get("startTime") or slot.get("start_time")
                end_str = slot.get("endTime") or slot.get("end_time")
                if start_str and end_str:
                    s_min = int(start_str.split(":")[0]) * 60 + int(start_str.split(":")[1])
                    e_min = int(end_str.split(":")[0]) * 60 + int(end_str.split(":")[1])
                    if s_min <= booking_minutes <= e_min:
                        time_slot_valid = True
                        break
            elif isinstance(slot, str) and "-" in slot:
                start_str, end_str = slot.split("-")
                s_min = int(start_str.split(":")[0]) * 60 + int(start_str.split(":")[1])
                e_min = int(end_str.split(":")[0]) * 60 + int(end_str.split(":")[1])
                if s_min <= booking_minutes <= e_min:
                    time_slot_valid = True
                    break

        if not time_slot_valid:
            return f"Selected time {booking_time} is outside the service's available hours on {full_day_name}."

    else:
        # Fall back to provider-level availability
        availability = provider.get("availability") or {}
        if weekday_name not in availability or not availability[weekday_name]:
            return f"Provider does not work on {full_day_name}s."
            
        try:
            for slot in availability[weekday_name]:
                start_str, end_str = slot.split("-")
                start_min = int(start_str.split(":")[0]) * 60 + int(start_str.split(":")[1])
                end_min = int(end_str.split(":")[0]) * 60 + int(end_str.split(":")[1])
                if start_min <= booking_minutes <= end_min:
                    time_slot_valid = True
                    break
        except Exception:
            return "Invalid booking time or working hours format."
            
        if not time_slot_valid:
            return f"Selected time {booking_time} is outside provider's working hours on {full_day_name}."
        
    conflict = bookings_collection.find_one({
        "provider_id": provider_id,
        "booking_date": booking_date,
        "booking_time": booking_time,
        "booking_status": {"$in": ["Pending", "Accepted"]}
    })
    if conflict:
        return "Selected time slot is already booked."
        
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    if customer:
        cust_lat = customer.get("latitude")
        cust_lng = customer.get("longitude")
        prov_lat = provider.get("latitude")
        prov_lng = provider.get("longitude")
        prov_radius = provider.get("service_radius")
        
        if cust_lat is not None and cust_lng is not None and prov_lat is not None and prov_lng is not None and prov_radius is not None:
            from app.services.repository import calculate_haversine_distance
            dist = calculate_haversine_distance(float(cust_lat), float(cust_lng), float(prov_lat), float(prov_lng))
            if dist > float(prov_radius):
                return f"Your location is outside provider's service area ({dist:.2f} km away, radius: {prov_radius} km)."

    return None

# Service function to handle booking creation
def create_booking(customer_id: str, booking_data: dict) -> dict:
    provider_id = booking_data.get("provider_id")
    service_id = booking_data.get("service_id")
    booking_date = booking_data.get("booking_date")
    booking_time = booking_data.get("booking_time")
    
    err = validate_provider_availability(provider_id, booking_date, booking_time, customer_id, service_id=service_id)
    if err:
        raise ValueError(err)

    provider = None
    if provider_id:
        try:
            provider = users_collection.find_one({"_id": ObjectId(provider_id)}, {"hourly_rate": 1})
        except Exception:
            pass

    # Build booking document schema structure
    doc = {
        # Set customer ID string
        "customer_id": customer_id,
        # Set provider ID string
        "provider_id": provider_id,
        # Set service ID reference
        "service_id": booking_data.get("service_id"),
        # Set requested date string
        "booking_date": booking_data.get("booking_date"),
        # Set requested time slot string
        "booking_time": booking_data.get("booking_time"),
        # Set customer street address
        "booking_address": booking_data.get("booking_address"),
        # Set optional notes text
        "notes": booking_data.get("notes", ""),
        # Set initial status as Pending
        "booking_status": "Pending",
        # Set initial payment status as Pending
        "payment_status": "Pending",
        # Set numeric total amount
        "total_amount": booking_data.get("total_amount", 0.0),
        # Set created timestamp
        "created_at": datetime.utcnow(),
    }

    # Call repository layer to save booking document and return ID
    booking_id = repository.create_booking(doc)
    # Add new string ID to return dictionary representation
    doc["_id"] = booking_id

    # Lookup details to send booking alert to the provider
    try:
        # Default service name placeholder
        service_name = "Service"
        # Query service record from services collection
        service_doc = services_collection.find_one({"_id": ObjectId(doc["service_id"])})
        # If service record exists
        if service_doc:
            # Get title of service
            service_name = service_doc.get("title", "Service")
        
        # Default customer name placeholder
        customer_name = "A Customer"
        # Query customer user profile
        customer_doc = users_collection.find_one({"_id": ObjectId(customer_id)})
        # If customer user profile exists
        if customer_doc:
            # Get full name of customer
            customer_name = customer_doc.get("full_name", "A Customer")
        
        # Build booking created notification message
        msg = f"New booking received from {customer_name} for {service_name}."
        # Trigger notification creation for the provider
        create_notification(
            # Recipient user ID is the provider
            user_id=provider_id,
            # Message title
            title="New Booking Received",
            # Alert message text
            message=msg,
            # Set type
            notification_type="BOOKING_CREATED",
            # Set reference booking ID
            booking_id=booking_id
        )
    # Catch lookup/parsing exceptions during notification trigger
    except Exception:
        # Suppress any alert transmission errors
        pass

    # Return created booking document representation
    return doc

# Service function to get client bookings
def get_my_bookings(customer_id: str) -> list:
    # Query repository for client bookings list
    bookings = repository.get_bookings_by_customer(customer_id)
    # List to hold enriched bookings
    enriched = []
    # Loop over bookings list
    for b in bookings:
        # Get provider ID string
        provider_id = b.get("provider_id")
        # Check if provider ID exists
        if provider_id:
            # Try fetching provider name and metadata
            try:
                # Query users collection for profile fields
                provider = users_collection.find_one(
                    # Find provider by ID
                    {"_id": ObjectId(provider_id)},
                    # Select fields to include
                    {"full_name": 1, "provider_category": 1, "profile_image": 1, "_id": 0}
                )
                # Check if provider exists
                if provider:
                    # Enrich booking with provider name
                    b["provider_name"] = provider.get("full_name", "Unknown")
                    # Enrich booking with category name
                    b["provider_category"] = provider.get("provider_category", "")
                    # Enrich booking with profile image
                    b["provider_image"] = provider.get("profile_image", "")
            # Catch exceptions
            except Exception:
                # Suppress profile lookup errors
                pass

        # Check if booking is reviewed
        try:
            from app.reviews.repository import reviews_collection
            review_doc = reviews_collection.find_one({"booking_id": b["_id"]})
            b["is_reviewed"] = True if review_doc else False
        except Exception:
            b["is_reviewed"] = False

        # Append enriched booking to list
        enriched.append(b)
    # Return enriched list
    return enriched

# Service function to cancel a booking from user side
def cancel_booking(booking_id: str, customer_id: str) -> bool:
    # Retrieve target booking details from database
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    # Call repository layer to update booking status in database
    success = repository.cancel_booking(booking_id, customer_id)
    
    # Check if update succeeded
    if success and booking:
        # Try sending cancel notification alert to provider
        try:
            # Default service title placeholder
            service_name = "Service"
            # Retrieve service record
            service_doc = services_collection.find_one({"_id": ObjectId(booking["service_id"])})
            # If service record exists
            if service_doc:
                # Get service title
                service_name = service_doc.get("title", "Service")
            
            # Default customer name placeholder
            customer_name = "Customer"
            # Retrieve customer details
            customer_doc = users_collection.find_one({"_id": ObjectId(customer_id)})
            # If customer details exist
            if customer_doc:
                # Get customer full name
                customer_name = customer_doc.get("full_name", "Customer")
            
            # Trigger alert creation for the provider
            create_notification(
                # Recipient is the provider user ID
                user_id=booking["provider_id"],
                # Set alert message title
                title="Booking Cancelled",
                # Write alert details text
                message=f"Booking for {service_name} has been cancelled by the customer {customer_name}.",
                # Set type
                notification_type="BOOKING_CANCELLED",
                # Set booking ID reference
                booking_id=booking_id
            )
        # Suppress lookup exceptions
        except Exception:
            # Suppress alert errors
            pass
            
    # Return operation success status flag
    return success

def request_reschedule_booking(booking_id: str, customer_id: str, new_date: str, new_time: str, reason: str = None) -> bool:
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return False
        
    if booking.get("customer_id") != customer_id:
        return False
        
    status = booking.get("booking_status")
    if status not in ["Pending", "Accepted"]:
        return False

    try:
        from datetime import datetime
        req_dt = datetime.strptime(f"{new_date} {new_time}", "%Y-%m-%d %H:%M")
        if req_dt < datetime.utcnow():
            return False
    except Exception:
        return False
        
    res = bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {
            "reschedule_requested": True,
            "reschedule_date": new_date,
            "reschedule_time": new_time,
            "reschedule_reason": reason or "",
            "reschedule_requested_at": datetime.utcnow()
        }}
    )
    
    if res.modified_count > 0:
        try:
            create_notification(
                user_id=booking["provider_id"],
                title="Reschedule Requested",
                message=f"Customer has requested to reschedule booking to {new_date} at {new_time}. Reason: {reason or 'None'}",
                notification_type="BOOKING_RESCHEDULE_REQUEST",
                booking_id=booking_id
            )
        except Exception:
            pass
        return True
        
    return False

def accept_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return False
        
    if booking.get("provider_id") != provider_id:
        return False
        
    if not booking.get("reschedule_requested"):
        return False

    res = bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {
            "booking_date": booking["reschedule_date"],
            "booking_time": booking["reschedule_time"],
            "reschedule_requested": False
        }, "$unset": {
            "reschedule_date": "",
            "reschedule_time": "",
            "reschedule_reason": ""
        }}
    )
    
    if res.modified_count > 0:
        try:
            create_notification(
                user_id=booking["customer_id"],
                title="Reschedule Request Approved",
                message=f"Provider approved your reschedule request. New time: {booking['reschedule_date']} at {booking['reschedule_time']}",
                notification_type="BOOKING_RESCHEDULE_ACCEPTED",
                booking_id=booking_id
            )
        except Exception:
            pass
        return True
    return False

def reject_reschedule_booking(booking_id: str, provider_id: str) -> bool:
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return False
        
    if booking.get("provider_id") != provider_id:
        return False
        
    if not booking.get("reschedule_requested"):
        return False

    res = bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {
            "reschedule_requested": False
        }, "$unset": {
            "reschedule_date": "",
            "reschedule_time": "",
            "reschedule_reason": ""
        }}
    )
    
    if res.modified_count > 0:
        try:
            create_notification(
                user_id=booking["customer_id"],
                title="Reschedule Request Rejected",
                message="Provider rejected your reschedule request. The original booking time remains unchanged.",
                notification_type="BOOKING_RESCHEDULE_REJECTED",
                booking_id=booking_id
            )
        except Exception:
            pass
        return True
    return False
