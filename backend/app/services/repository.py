from app.database.connection import db
from bson import ObjectId

services_collection = db["services"]

import math

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def get_services(name: str = None, category: str = None, city: str = None,
                 min_price: float = None, max_price: float = None,
                 min_rating: float = None, availability: str = None,
                 q: str = None, lat: float = None, lng: float = None,
                 radius: float = 10.0, sort_by: str = None,
                 page: int = 1, limit: int = 10):
    query = {"status": "active"}

    if category:
        query["category_name"] = {"$regex": category, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    if min_price is not None:
        query.setdefault("price_value", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price_value", {})["$lte"] = max_price

    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}

    if availability:
        day_key = f"availability.{availability.lower()}"
        query[day_key] = {"$exists": True, "$ne": [], "$not": {"$size": 0}}
    
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category_name": {"$regex": q, "$options": "i"}},
            {"provider_name": {"$regex": q, "$options": "i"}}
        ]
    elif name:
        query["title"] = {"$regex": name, "$options": "i"}

    # MongoDB Geo-Near filter
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

    services = list(services_collection.find(query))
    
    # Exclude services from suspended, rejected, or non-approved providers
    users_collection = db["users"]
    approved_providers = list(users_collection.find(
        {"role": {"$in": ["Provider", "provider"]}, "account_status": "approved"},
        {"_id": 1}
    ))
    approved_provider_ids = set(str(u["_id"]) for u in approved_providers)
    services = [s for s in services if s.get("provider_id") in approved_provider_ids]

    # Process distances and service area boundaries
    processed = []
    for s in services:
        s["_id"] = str(s["_id"])
        s_lat = s.get("latitude")
        s_lng = s.get("longitude")
        
        if lat is not None and lng is not None and s_lat is not None and s_lng is not None:
            dist = calculate_haversine_distance(float(lat), float(lng), float(s_lat), float(s_lng))
            s["distance"] = dist
            
            # Filter by provider service radius
            s_radius = s.get("service_radius")
            if s_radius is not None:
                if dist <= float(s_radius):
                    processed.append(s)
            else:
                processed.append(s)
        else:
            if lat is None or lng is None:
                processed.append(s)
                
    services = processed

    # Sorting
    if sort_by == "price_low_high":
      services.sort(key=lambda x: x.get("price_value", 0.0))
    elif sort_by == "price_high_low":
      services.sort(key=lambda x: x.get("price_value", 0.0), reverse=True)
    elif sort_by == "rating":
      services.sort(key=lambda x: x.get("average_rating", 0.0), reverse=True)
    elif sort_by == "distance":
      if lat is not None and lng is not None:
        services.sort(key=lambda x: x.get("distance", 999999.0))
    elif sort_by == "relevance":
      search_term = q or name
      if search_term:
        t = search_term.lower()
        def get_score(s):
          score = 0
          title = (s.get("title") or "").lower()
          desc = (s.get("description") or "").lower()
          cat = (s.get("category_name") or "").lower()
          prov = (s.get("provider_name") or "").lower()
          if t in title: score += 10
          if t in cat: score += 5
          if t in prov: score += 3
          if t in desc: score += 1
          return score
        services.sort(key=get_score, reverse=True)

    # Pagination slicing
    total_count = len(services)
    start = (page - 1) * limit
    end = start + limit
    paginated = services[start:end]

    return {
        "services": paginated,
        "total_count": total_count,
        "page": page,
        "limit": limit
    }

def get_service_by_id(service_id: str):
    try:
        service = services_collection.find_one({"_id": ObjectId(service_id)})
        if service:
            service["_id"] = str(service["_id"])
        return service
    except Exception:
        return None
