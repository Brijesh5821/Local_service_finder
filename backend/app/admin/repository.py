from app.database.connection import db
from bson import ObjectId
from datetime import datetime

users_collection = db["users"]
bookings_collection = db["bookings"]
services_collection = db["services"]


def get_users() -> list:
    users = list(users_collection.find())
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("password", None)
    return users


def update_user_status(user_id: str, status: str = None, is_active: bool = None) -> dict:
    update_data = {}
    if status is not None:
        update_data["status"] = status
        if status == "active":
            update_data["account_status"] = "approved"
        elif status == "suspended":
            update_data["account_status"] = "suspended"
    if is_active is not None:
        update_data["is_active"] = is_active

    if update_data:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
    return user


def approve_user(user_id: str, admin_id: str) -> dict:
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return None
        
    update_data = {
        "account_status": "approved",
        "status": "active",
        "is_active": True,
        "approved_by": admin_id,
        "approved_at": datetime.utcnow()
    }
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
    return user


def reject_user(user_id: str, admin_id: str, rejection_reason: str = None) -> dict:
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return None
        
    update_data = {
        "account_status": "rejected",
        "status": "rejected",
        "is_active": False,
        "rejected_by": admin_id,
        "rejected_at": datetime.utcnow()
    }
    if rejection_reason is not None:
        update_data["rejection_reason"] = rejection_reason
        
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
    return user


def get_user_details(user_id: str) -> dict:
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        user["_id"] = str(user["_id"])
        user.pop("password", None)

        # Calculate statistics
        role = user.get("role", "User")
        if role.lower() == "provider":
            user["total_services"] = services_collection.count_documents({"provider_id": user_id})
            user["total_bookings"] = bookings_collection.count_documents({"provider_id": user_id})
            user["total_reviews"] = db["reviews"].count_documents({"provider_id": user_id})
        else:
            user["total_bookings"] = bookings_collection.count_documents({"customer_id": user_id})
            user["total_reviews"] = db["reviews"].count_documents({"customer_id": user_id})

        return user
    except Exception:
        return None


def delete_user_safely(user_id: str) -> dict:
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"not_found": True}

    # Check for historical bookings and reviews
    bookings_count = bookings_collection.count_documents({
        "$or": [{"customer_id": user_id}, {"provider_id": user_id}]
    })
    reviews_count = db["reviews"].count_documents({
        "$or": [{"customer_id": user_id}, {"provider_id": user_id}]
    })
    services_count = services_collection.count_documents({"provider_id": user_id})

    # If historical records exist, soft-deactivate to retain audit integrity
    if bookings_count > 0 or reviews_count > 0:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "status": "deactivated",
                "is_active": False,
                "account_status": "suspended",
                "deactivated_at": datetime.utcnow()
            }}
        )
        # Also deactivate any services owned by the provider
        if services_count > 0:
            services_collection.update_many(
                {"provider_id": user_id},
                {"$set": {"status": "inactive"}}
            )
        return {
            "success": True,
            "action": "deactivated",
            "message": f"User deactivated safely. Preserved {bookings_count} booking(s) and {reviews_count} review(s) for historical integrity."
        }

    # Clean delete if no historical bookings or reviews exist
    if services_count > 0:
        services_collection.delete_many({"provider_id": user_id})
    users_collection.delete_one({"_id": ObjectId(user_id)})
    return {
        "success": True,
        "action": "deleted",
        "message": "User account and orphan listings permanently deleted."
    }


def get_bookings() -> list:
    bookings = list(bookings_collection.find().sort("created_at", -1))
    for b in bookings:
        b["_id"] = str(b["_id"])
        
        # Enrich with customer name
        customer_id = b.get("customer_id")
        if customer_id:
            try:
                cust = users_collection.find_one({"_id": ObjectId(customer_id)}, {"full_name": 1})
                if cust:
                    b["customer_name"] = cust.get("full_name")
            except Exception:
                b["customer_name"] = "Unknown Customer"
        
        # Enrich with provider name
        provider_id = b.get("provider_id")
        if provider_id:
            try:
                prov = users_collection.find_one({"_id": ObjectId(provider_id)}, {"full_name": 1})
                if prov:
                    b["provider_name"] = prov.get("full_name")
            except Exception:
                b["provider_name"] = "Unknown Provider"

        # Convert datetimes
        if "created_at" in b and isinstance(b["created_at"], datetime):
            b["created_at"] = b["created_at"].isoformat()
            
    return bookings


def update_booking_status(booking_id: str, booking_status: str, payment_status: str = None) -> dict:
    update_data = {
        "booking_status": booking_status,
        "updated_at": datetime.utcnow()
    }
    if payment_status is not None:
        update_data["payment_status"] = payment_status

    bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    booking = bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if booking:
        booking["_id"] = str(booking["_id"])
        if "created_at" in booking and isinstance(booking["created_at"], datetime):
            booking["created_at"] = booking["created_at"].isoformat()
        if "updated_at" in booking and isinstance(booking["updated_at"], datetime):
            booking["updated_at"] = booking["updated_at"].isoformat()
    return booking


def get_services() -> list:
    services = list(services_collection.find().sort("created_at", -1))
    for s in services:
        s["_id"] = str(s["_id"])
        if "created_at" in s and isinstance(s["created_at"], datetime):
            s["created_at"] = s["created_at"].isoformat()
    return services


def delete_service(service_id: str) -> bool:
    res = services_collection.delete_one({"_id": ObjectId(service_id)})
    return res.deleted_count > 0


def get_stats() -> dict:
    total_users = users_collection.count_documents({})
    total_providers = users_collection.count_documents({"role": {"$regex": "^provider$", "$options": "i"}})
    total_services = services_collection.count_documents({})
    total_bookings = bookings_collection.count_documents({})
    
    # Calculate Completed Booking Earnings
    pipeline = [
        {"$match": {"booking_status": "Completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    res = list(bookings_collection.aggregate(pipeline))
    total_earnings = float(res[0]["total"]) if res and res[0].get("total") is not None else 0.0

    # Bookings by Status
    bookings_by_status = {}
    for status in ["Pending", "Accepted", "Completed", "Cancelled", "Rejected"]:
        bookings_by_status[status] = bookings_collection.count_documents({"booking_status": status})

    # Users by Role
    users_by_role = {}
    for role in ["User", "Provider", "Admin"]:
        users_by_role[role] = users_collection.count_documents({"role": {"$regex": f"^{role}$", "$options": "i"}})

    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_services": total_services,
        "total_bookings": total_bookings,
        "total_earnings": total_earnings,
        "bookings_by_status": bookings_by_status,
        "users_by_role": users_by_role
     }

def get_categories() -> list:
    cats = list(db["categories"].find())
    for c in cats:
        c["_id"] = str(c["_id"])
    return cats


def get_public_categories() -> list:
    """Returns only active categories for public/provider use."""
    cats = list(db["categories"].find({"is_active": {"$ne": False}}))
    for c in cats:
        c["_id"] = str(c["_id"])
    return cats


def create_category(data: dict) -> dict:
    data["created_at"] = datetime.utcnow()
    data.setdefault("is_active", True)
    res = db["categories"].insert_one(data)
    data["_id"] = str(res.inserted_id)
    return data


def update_category(category_id: str, data: dict) -> dict:
    filtered = {k: v for k, v in data.items() if v is not None}
    if filtered:
        db["categories"].update_one(
            {"_id": ObjectId(category_id)},
            {"$set": filtered}
        )
    cat = db["categories"].find_one({"_id": ObjectId(category_id)})
    if cat:
        cat["_id"] = str(cat["_id"])
    return cat


def toggle_category_status(category_id: str, is_active: bool) -> dict:
    """Enable or disable a category (soft enable/disable)."""
    db["categories"].update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {"is_active": is_active, "updated_at": datetime.utcnow()}}
    )
    cat = db["categories"].find_one({"_id": ObjectId(category_id)})
    if cat:
        cat["_id"] = str(cat["_id"])
    return cat


def delete_category(category_id: str) -> dict:
    """
    Soft-delete a category by setting is_active=False.
    Returns {"deleted": True} on success or {"conflict": True} if active services reference it.
    """
    cat = db["categories"].find_one({"_id": ObjectId(category_id)})
    if not cat:
        return {"not_found": True}

    category_name = cat.get("category_name", "")
    # Check if any active service still references this category
    active_ref_count = services_collection.count_documents(
        {"category_name": {"$regex": f"^{category_name}$", "$options": "i"}, "status": "active"}
    )
    if active_ref_count > 0:
        return {"conflict": True, "count": active_ref_count}

    # Safe to soft-delete
    db["categories"].update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}}
    )
    return {"deleted": True}


def approve_service(service_id: str) -> dict:
    """Approve a pending_approval service — makes it publicly visible."""
    services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"status": "active", "approved_at": datetime.utcnow()},
         "$unset": {"rejection_reason": ""}}
    )
    svc = services_collection.find_one({"_id": ObjectId(service_id)})
    if svc:
        svc["_id"] = str(svc["_id"])
    return svc


def reject_service(service_id: str, reason: str = None) -> dict:
    """Reject a pending_approval service with an optional reason."""
    update = {"status": "rejected", "rejected_at": datetime.utcnow()}
    if reason:
        update["rejection_reason"] = reason
    services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update}
    )
    svc = services_collection.find_one({"_id": ObjectId(service_id)})
    if svc:
        svc["_id"] = str(svc["_id"])
    return svc
