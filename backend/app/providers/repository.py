import re
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

def parse_time_to_minutes(time_str: str) -> int:
    if not time_str:
        return 0
    clean = time_str.strip().upper()
    for fmt in ("%H:%M", "%I:%M %p", "%I:%M%p", "%I %p"):
        try:
            dt = datetime.strptime(clean, fmt)
            return dt.hour * 60 + dt.minute
        except ValueError:
            pass
    try:
        is_pm = "PM" in clean
        is_am = "AM" in clean
        raw = clean.replace("AM", "").replace("PM", "").strip()
        parts = raw.split(":")
        h = int(parts[0])
        m = int(parts[1][:2]) if len(parts) > 1 else 0
        if is_pm and h < 12:
            h += 12
        if is_am and h == 12:
            h = 0
        return h * 60 + m
    except Exception:
        return 0


def is_provider_available_at_time(provider: dict, date_str: str, req_start_min: int, req_end_min: int) -> bool:
    # 1. Check holidays
    holidays = provider.get("holidays") or []
    if date_str in holidays:
        return False

    # 2. Check weekly schedule (if configured on provider)
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        weekday = dt.strftime("%A").lower()
    except Exception:
        return False

    avail = provider.get("availability")
    if avail and isinstance(avail, dict):
        if weekday in avail:
            day_slots = avail[weekday]
            if not day_slots:
                # Explicitly empty list means provider is not working on this weekday
                return False
            
            # Check if requested range fits inside at least one working slot
            slot_fits = False
            for slot in day_slots:
                if isinstance(slot, str) and "-" in slot:
                    s_str, e_str = slot.split("-")
                    s_min = parse_time_to_minutes(s_str)
                    e_min = parse_time_to_minutes(e_str)
                    if s_min <= req_start_min and req_end_min <= e_min:
                        slot_fits = True
                        break
                elif isinstance(slot, dict):
                    s_str = slot.get("startTime") or slot.get("start_time")
                    e_str = slot.get("endTime") or slot.get("end_time")
                    if s_str and e_str:
                        s_min = parse_time_to_minutes(s_str)
                        e_min = parse_time_to_minutes(e_str)
                        if s_min <= req_start_min and req_end_min <= e_min:
                            slot_fits = True
                            break
            if not slot_fits:
                return False

    # 3. Check booking conflicts on that date
    prov_id_str = str(provider["_id"])
    id_list = [prov_id_str]
    try:
        id_list.append(ObjectId(prov_id_str))
    except Exception:
        pass

    conflicting_bookings = list(bookings_collection.find({
        "provider_id": {"$in": id_list},
        "booking_date": date_str,
        "booking_status": {"$in": ["Pending", "Accepted", "Confirmed", "pending", "accepted", "confirmed"]}
    }))

    for b in conflicting_bookings:
        b_time = b.get("booking_time", "")
        if not b_time:
            continue
            
        if " - " in b_time:
            parts = b_time.split(" - ")
            b_start = parse_time_to_minutes(parts[0])
            b_end = parse_time_to_minutes(parts[1])
        else:
            b_start = parse_time_to_minutes(b_time)
            b_end = b_start + 60  # Default 1 hour slot if single timestamp given

        # Overlap condition: max(req_start, b_start) < min(req_end, b_end)
        if max(req_start_min, b_start) < min(req_end_min, b_end):
            return False

    return True


# Existing repository function to list providers with filters
def get_providers(name: str = None, category: str = None, city: str = None,
                  min_price: float = None, max_price: float = None,
                  min_rating: float = None, availability: str = None,
                  date: str = None, start_time: str = None, end_time: str = None,
                  lat: float = None, lng: float = None, radius: float = 10.0,
                  sort_by: str = None, page: int = 1, limit: int = 10):
    # Base query filters for finding users who have the role of provider and are approved
    query = {
        "role": {"$in": ["Provider", "provider"]},
        "$or": [
            {"account_status": "approved"},
            {"account_status": {"$exists": False}, "status": "active"}
        ]
    }

    # Apply name query filter using regex
    if name and name.strip():
        query["full_name"] = {"$regex": name.strip(), "$options": "i"}
        
    # Apply category query filter using regex
    if category and category.strip() and category.strip() != "All Categories":
        cat_clean = category.strip()
        # Find provider IDs from services collection that offer this category
        matching_srv_prov_ids = services_collection.distinct(
            "provider_id",
            {"$or": [
                {"category": {"$regex": f"^{re.escape(cat_clean)}$", "$options": "i"}},
                {"category_name": {"$regex": f"^{re.escape(cat_clean)}$", "$options": "i"}}
            ]}
        )
        prov_obj_ids = []
        for p_id in matching_srv_prov_ids:
            if isinstance(p_id, str):
                try:
                    prov_obj_ids.append(ObjectId(p_id))
                except Exception:
                    pass
            prov_obj_ids.append(p_id)

        query["$and"] = [
            {"$or": [
                {"provider_category": {"$regex": f"^{re.escape(cat_clean)}$", "$options": "i"}},
                {"_id": {"$in": prov_obj_ids}}
            ]}
        ]

    # Apply city filter using regex
    if city and city.strip():
        query["city"] = {"$regex": city.strip(), "$options": "i"}
    # Apply minimum price constraint
    if min_price is not None:
        query.setdefault("hourly_rate", {})["$gte"] = min_price
    # Apply maximum price constraint
    if max_price is not None:
        query.setdefault("hourly_rate", {})["$lte"] = max_price
    # Apply minimum rating constraint
    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}
    # Apply weekday availability constraint
    if availability and availability.strip():
        query[f"availability.{availability.lower().strip()}"] = {"$exists": True, "$ne": [], "$not": {"$size": 0}}

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

    # Apply Date + Time Slot filtering if date is provided
    if date and date.strip():
        date_clean = date.strip()
        req_start_min = parse_time_to_minutes(start_time) if start_time else 0
        req_end_min = parse_time_to_minutes(end_time) if end_time else 1440
        if req_end_min <= req_start_min:
            req_end_min = req_start_min + 60  # Default 1 hr duration fallback if invalid

        available_providers = []
        for p in providers:
            if is_provider_available_at_time(p, date_clean, req_start_min, req_end_min):
                available_providers.append(p)
        providers = available_providers

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

def get_categories() -> list:
    """Returns all unique category names dynamically from the database."""
    cat_docs = list(db["categories"].find({"is_active": {"$ne": False}}, {"category_name": 1, "_id": 0}))
    categories = [c["category_name"] for c in cat_docs if c.get("category_name")]
    
    prov_cats = users_collection.distinct("provider_category", {"role": {"$in": ["Provider", "provider"]}})
    for pc in prov_cats:
        if pc and pc not in categories:
            categories.append(pc)
            
    srv_cats = services_collection.distinct("category_name")
    for sc in srv_cats:
        if sc and sc not in categories:
            categories.append(sc)

    return sorted(categories)


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
    from bson import ObjectId
    prov_ids = [provider_id]
    if ObjectId.is_valid(provider_id):
        prov_ids.append(ObjectId(provider_id))

    prov_filter = {"provider_id": {"$in": prov_ids}}
    total_bookings = bookings_collection.count_documents(prov_filter)

    def count_status(status_regex):
        return bookings_collection.count_documents({
            "$and": [
                prov_filter,
                {"booking_status": {"$regex": f"^{status_regex}$", "$options": "i"}}
            ]
        })

    pending_bookings = count_status("Pending")
    accepted_bookings = count_status("Accepted")
    completed_bookings = count_status("Completed")
    cancelled_bookings = count_status("Cancelled")
    rejected_bookings = count_status("Rejected")

    completed_list = list(bookings_collection.find({
        "$and": [
            prov_filter,
            {"booking_status": {"$regex": "^Completed$", "$options": "i"}}
        ]
    }))

    total_earnings = 0.0
    for b in completed_list:
        val = b.get("total_amount") or b.get("amount") or b.get("hourly_rate") or b.get("price_value") or b.get("price") or 0.0
        try:
            total_earnings += float(val)
        except (ValueError, TypeError):
            pass

    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "accepted_bookings": accepted_bookings,
        "completed_bookings": completed_bookings,
        "cancelled_bookings": cancelled_bookings + rejected_bookings,
        "total_earnings": round(total_earnings, 2)
    }

# Function to get bookings for a provider
def get_provider_bookings(provider_id: str) -> list:
    from bson import ObjectId
    prov_ids = [provider_id]
    if ObjectId.is_valid(provider_id):
        prov_ids.append(ObjectId(provider_id))

    cursor = bookings_collection.find({"provider_id": {"$in": prov_ids}}).sort("created_at", -1)
    bookings = list(cursor)
    for b in bookings:
        b["_id"] = str(b["_id"])
    return bookings
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
