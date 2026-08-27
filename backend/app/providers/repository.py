# Import db from connection settings
from app.database.connection import db
# Import ObjectId from bson to convert string representations of MongoDB IDs
from bson import ObjectId
# Import datetime to log timestamps
from datetime import datetime

# Reference the users collection in MongoDB
users_collection = db["users"]
# Reference the bookings collection in MongoDB
bookings_collection = db["bookings"]
# Reference the services collection in MongoDB
services_collection = db["services"]

import math

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# Existing repository function to list providers with filters
def get_providers(name: str = None, category: str = None, city: str = None,
                  min_price: float = None, max_price: float = None,
                  min_rating: float = None, availability: str = None,
                  lat: float = None, lng: float = None, radius: float = 10.0,
                  sort_by: str = None, page: int = 1, limit: int = 10):
    # Base query filters for finding users who have the role of provider
    query = {"role": {"$in": ["Provider", "provider"]}}

    # Apply name query filter using regex
    if name:
        # Match name case-insensitively
        query["full_name"] = {"$regex": name, "$options": "i"}
    # Apply category query filter using regex
    if category:
        # Match provider category case-insensitively
        query["provider_category"] = {"$regex": category, "$options": "i"}
    # Apply city filter using regex
    if city:
        # Match city case-insensitively
        query["city"] = {"$regex": city, "$options": "i"}
    # Apply minimum price constraint
    if min_price is not None:
        # Set greater-than-or-equal hourly rate filter
        query.setdefault("hourly_rate", {})["$gte"] = min_price
    # Apply maximum price constraint
    if max_price is not None:
        # Set less-than-or-equal hourly rate filter
        query.setdefault("hourly_rate", {})["$lte"] = max_price
    # Apply minimum rating constraint
    if min_rating is not None:
        # Set rating filter
        query["average_rating"] = {"$gte": min_rating}
    # Apply weekday availability constraint
    if availability:
        # Check if availability weekday key has non-empty list of slots
        query[f"availability.{availability.lower()}"] = {"$exists": True, "$ne": [], "$not": {"$size": 0}}

    # MongoDB Geo-Near index filter
    if lat is not None and lng is not None:
        query["location"] = {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [float(lng), float(lat)]
                },
                "$maxDistance": radius * 1000
            }
        }

    # Query MongoDB for matching providers, hiding password hashes
    providers = list(users_collection.find(query, {"password": 0}))
    
    # Process distance & service radius boundaries
    processed = []
    for p in providers:
        p["_id"] = str(p["_id"])
        p_lat = p.get("latitude")
        p_lng = p.get("longitude")
        
        if lat is not None and lng is not None and p_lat is not None and p_lng is not None:
            dist = calculate_haversine_distance(float(lat), float(lng), float(p_lat), float(p_lng))
            p["distance"] = dist
            
            # Enforce Service Area
            p_radius = p.get("service_radius")
            if p_radius is not None:
                if dist <= float(p_radius):
                    processed.append(p)
            else:
                processed.append(p)
        else:
            if lat is None or lng is None:
                processed.append(p)
                
    providers = processed

    # Sorting
    if sort_by == "price_low_high":
        providers.sort(key=lambda x: x.get("hourly_rate", 0.0) if x.get("hourly_rate") is not None else 0.0)
    elif sort_by == "price_high_low":
        providers.sort(key=lambda x: x.get("hourly_rate", 0.0) if x.get("hourly_rate") is not None else 0.0, reverse=True)
    elif sort_by == "rating":
        providers.sort(key=lambda x: x.get("average_rating", 0.0) if x.get("average_rating") is not None else 0.0, reverse=True)
    elif sort_by == "distance":
        if lat is not None and lng is not None:
            providers.sort(key=lambda x: x.get("distance", 999999.0))
    elif sort_by == "relevance":
        search_term = name or category
        if search_term:
            t = search_term.lower()
            def get_score(p):
                score = 0
                fname = (p.get("full_name") or "").lower()
                pcat = (p.get("provider_category") or "").lower()
                desc = (p.get("description") or "").lower()
                if t in fname: score += 10
                if t in pcat: score += 5
                if t in desc: score += 1
                return score
            providers.sort(key=get_score, reverse=True)

    # Pagination slicing
    total_count = len(providers)
    start = (page - 1) * limit
    end = start + limit
    paginated = providers[start:end]

    return {
        "providers": paginated,
        "total_count": total_count,
        "page": page,
        "limit": limit
    }

# Existing repository function to find a provider by string ID
def get_provider_by_id(provider_id: str):
    # Find matching provider document by converted ObjectId and provider role
    provider = users_collection.find_one(
        # ID and role filters
        {"_id": ObjectId(provider_id), "role": {"$in": ["Provider", "provider"]}},
        # Exclude password field
        {"password": 0}
    )
    # Check if provider document was found
    if provider:
        # Convert Object ID to string representation
        provider["_id"] = str(provider["_id"])
    # Return provider document or None
    return provider

# Function to get booking statistics and total earnings for a provider
def get_provider_dashboard_stats(provider_id: str) -> dict:
    # Count total bookings registered for the provider
    total_bookings = bookings_collection.count_documents({"provider_id": provider_id})
    # Count bookings currently in Pending status
    pending_bookings = bookings_collection.count_documents({"provider_id": provider_id, "booking_status": "Pending"})
    # Count bookings currently in Accepted status
    accepted_bookings = bookings_collection.count_documents({"provider_id": provider_id, "booking_status": "Accepted"})
    # Count bookings currently in Completed status
    completed_bookings = bookings_collection.count_documents({"provider_id": provider_id, "booking_status": "Completed"})
    # Count bookings currently in Cancelled status
    cancelled_bookings = bookings_collection.count_documents({"provider_id": provider_id, "booking_status": "Cancelled"})
    # Count bookings currently in Rejected status
    rejected_bookings = bookings_collection.count_documents({"provider_id": provider_id, "booking_status": "Rejected"})

    # Fetch completed bookings to calculate total sum of earnings
    completed_list = list(bookings_collection.find({"provider_id": provider_id, "booking_status": "Completed"}))
    # Sum the total_amount values of completed jobs
    total_earnings = sum(float(b.get("total_amount", 0.0)) for b in completed_list)

    # Return stats dictionary structure
    return {
        # Total bookings value
        "total_bookings": total_bookings,
        # Pending count
        "pending_bookings": pending_bookings,
        # Accepted count
        "accepted_bookings": accepted_bookings,
        # Completed count
        "completed_bookings": completed_bookings,
        # Cancelled count (sum of rejected and cancelled statuses)
        "cancelled_bookings": cancelled_bookings + rejected_bookings,
        # Calculated total earnings value
        "total_earnings": total_earnings
    }

# Function to get bookings for a provider
def get_provider_bookings(provider_id: str) -> list:
    # Find bookings matching provider_id and sort by created_at descending
    cursor = bookings_collection.find({"provider_id": provider_id}).sort("created_at", -1)
    # Convert cursor to list of dictionaries
    bookings = list(cursor)
    # Iterate and normalize object IDs
    for b in bookings:
        # Convert booking _id field
        b["_id"] = str(b["_id"])
    # Return list
    return bookings

# Function to get a provider booking by ID
def get_provider_booking_by_id(booking_id: str, provider_id: str):
    # Find booking matching both booking ID and provider ID
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id), "provider_id": provider_id})
    # Check if booking exists
    if booking:
        # Convert booking ID to string
        booking["_id"] = str(booking["_id"])
    # Return booking
    return booking

# Function to update booking status and set updated timestamp
def update_booking_status(booking_id: str, provider_id: str, status: str, extra_fields: dict = None) -> dict:
    # Create the update document set mapping
    update_doc = {
        # Change booking status field
        "booking_status": status,
        # Log updated timestamp
        "updated_at": datetime.utcnow()
    }
    # Check if extra fields exist to merge
    if extra_fields:
        # Merge optional reasons or other fields into update document
        update_doc.update(extra_fields)
    
    # Run the update command in database
    bookings_collection.update_one(
        # Locate booking by ID and provider ID for access control
        {"_id": ObjectId(booking_id), "provider_id": provider_id},
        # Use $set update operator
        {"$set": update_doc}
    )
    # Fetch and return the updated booking document
    return get_provider_booking_by_id(booking_id, provider_id)

# Function to list services owned by a provider
def get_provider_services(provider_id: str) -> list:
    # Find services matching provider_id
    cursor = services_collection.find({"provider_id": provider_id})
    # Convert to list
    services = list(cursor)
    # Iterate and normalize IDs
    for s in services:
        # Convert service _id field to string
        s["_id"] = str(s["_id"])
    # Return services list
    return services

# Function to get provider service details by ID
def get_provider_service_by_id(service_id: str, provider_id: str):
    # Query service collection matching service ID and provider ID
    service = services_collection.find_one({"_id": ObjectId(service_id), "provider_id": provider_id})
    # Check if service exists
    if service:
        # Convert service ID to string
        service["_id"] = str(service["_id"])
    # Return service document
    return service

# Function to create a new service record
def create_service(service_doc: dict) -> str:
    # Insert new service document into database
    result = services_collection.insert_one(service_doc)
    # Return string representation of new ID
    return str(result.inserted_id)

# Function to update provider service fields
def update_service(service_id: str, provider_id: str, update_data: dict) -> dict:
    # Run update statement in database
    services_collection.update_one(
        # Match service by ID and provider owner ID
        {"_id": ObjectId(service_id), "provider_id": provider_id},
        # Set updated fields
        {"$set": update_data}
    )
    # Fetch updated service details
    return get_provider_service_by_id(service_id, provider_id)

# Function to delete a provider service
def delete_service(service_id: str, provider_id: str) -> bool:
    # Delete the matching service document from database
    result = services_collection.delete_one({"_id": ObjectId(service_id), "provider_id": provider_id})
    # Return True if a document was deleted
    return result.deleted_count > 0
