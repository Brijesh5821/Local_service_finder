from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from typing import Optional

from app.admin import controller
from app.config.settings import SECRET_KEY, ALGORITHM
from app.admin.schema import (
    UserStatusUpdate, BookingStatusUpdate, RejectRequest,
    CategoryCreate, CategoryUpdate, CategoryToggle, ServiceRejectRequest
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin Portal"]
)


def get_current_admin_id(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        if not role or role.lower() != "admin":
            raise HTTPException(status_code=403, detail="Only administrative staff can access this portal")

        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── DASHBOARD ──────────────────────────────────────────────────────────────────

@router.get("/dashboard/stats")
def get_dashboard_stats(admin_id: str = Depends(get_current_admin_id)):
    return controller.get_dashboard_stats()


# ── USERS ──────────────────────────────────────────────────────────────────────

@router.get("/users")
def get_users(admin_id: str = Depends(get_current_admin_id)):
    return controller.get_users()


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    admin_id: str = Depends(get_current_admin_id)
):
    res = controller.update_user_status(user_id, status_data.status, status_data.is_active)
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User status updated successfully", "user": res}


@router.patch("/users/{user_id}/approve")
def approve_user(
    user_id: str,
    admin_id: str = Depends(get_current_admin_id)
):
    from app.database.connection import db
    from bson import ObjectId
    user_doc = db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User account not found")

    account_status = user_doc.get("account_status", "pending")
    if account_status != "pending":
        raise HTTPException(status_code=400, detail="Account is not in pending state")

    res = controller.approve_user(user_id, admin_id)
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User account approved successfully", "user": res}


@router.get("/users/{user_id}")
def get_user_details(user_id: str, admin_id: str = Depends(get_current_admin_id)):
    user = controller.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return {"success": True, "user": user}


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_id: str = Depends(get_current_admin_id)):
    # Protect against self deletion
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own active account.")
    
    result = controller.delete_user_safely(user_id)
    if result.get("not_found"):
        raise HTTPException(status_code=404, detail="User account not found")
    
    return result


@router.patch("/users/{user_id}/reject")
def reject_user(
    user_id: str,
    reject_data: RejectRequest,
    admin_id: str = Depends(get_current_admin_id)
):
    from app.database.connection import db
    from bson import ObjectId
    user_doc = db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User account not found")

    account_status = user_doc.get("account_status", "pending")
    if account_status != "pending":
        raise HTTPException(status_code=400, detail="Account is not in pending state")

    res = controller.reject_user(user_id, admin_id, reject_data.rejection_reason)
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User account rejected successfully", "user": res}


# Document status update (Phase 9)
@router.patch("/users/{user_id}/documents/{doc_id}/status")
def update_document_status(
    user_id: str,
    doc_id: str,
    status: str = "pending",
    rejection_reason: str = "",
    admin_id: str = Depends(get_current_admin_id)
):
    from app.database.connection import db
    from bson import ObjectId
    from datetime import datetime

    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    user_doc = db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    docs = user_doc.get("verification_documents", [])
    updated = False
    for d in docs:
        if d.get("id") == doc_id:
            d["status"] = status
            d["reviewed_at"] = datetime.utcnow().isoformat()
            if status == "rejected" and rejection_reason:
                d["rejection_reason"] = rejection_reason
            else:
                d.pop("rejection_reason", None)
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Document not found")

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"verification_documents": docs}}
    )
    return {"success": True, "message": f"Document status updated to {status}"}


# Document view (Phase 9)
@router.get("/users/{user_id}/documents/{doc_id}/view")
def admin_view_document(
    user_id: str,
    doc_id: str,
    admin_id: str = Depends(get_current_admin_id)
):
    import os
    from fastapi.responses import FileResponse
    from app.database.connection import db
    from bson import ObjectId

    UPLOAD_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "uploads", "documents"
    )

    user_doc = db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    docs = user_doc.get("verification_documents", [])
    target_doc = next((d for d in docs if d.get("id") == doc_id), None)
    if not target_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, target_doc.get("file_name", ""))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")

    return FileResponse(file_path, filename=target_doc.get("file_name"))


# ── BOOKINGS ───────────────────────────────────────────────────────────────────

@router.get("/bookings")
def get_bookings(admin_id: str = Depends(get_current_admin_id)):
    return controller.get_bookings()


@router.patch("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: str,
    status_data: BookingStatusUpdate,
    admin_id: str = Depends(get_current_admin_id)
):
    res = controller.update_booking_status(booking_id, status_data.booking_status, status_data.payment_status)
    if not res:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "message": "Booking status updated successfully", "booking": res}


# ── SERVICES ───────────────────────────────────────────────────────────────────

@router.get("/services")
def get_services(admin_id: str = Depends(get_current_admin_id)):
    return controller.get_services()


@router.delete("/services/{service_id}")
def delete_service(service_id: str, admin_id: str = Depends(get_current_admin_id)):
    success = controller.delete_service(service_id)
    if not success:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"success": True, "message": "Service listing deleted successfully"}


@router.patch("/services/{service_id}/approve")
def approve_service(service_id: str, admin_id: str = Depends(get_current_admin_id)):
    svc = controller.approve_service(service_id)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"success": True, "message": "Service approved and is now publicly visible", "service": svc}


@router.patch("/services/{service_id}/reject")
def reject_service(
    service_id: str,
    body: ServiceRejectRequest,
    admin_id: str = Depends(get_current_admin_id)
):
    svc = controller.reject_service(service_id, body.reason)
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"success": True, "message": "Service rejected", "service": svc}


# ── CATEGORIES ─────────────────────────────────────────────────────────────────

@router.get("/categories")
def get_categories(admin_id: str = Depends(get_current_admin_id)):
    cats = controller.get_categories()
    return {"success": True, "categories": cats}


@router.get("/categories/public")
def get_public_categories():
    """No auth required — used by provider forms and ServicesPage filter."""
    cats = controller.get_public_categories()
    return {"success": True, "categories": cats}


@router.post("/categories")
def create_category(category_data: CategoryCreate, admin_id: str = Depends(get_current_admin_id)):
    cat = controller.create_category(category_data.model_dump())
    return {"success": True, "message": "Category created successfully", "category": cat}


@router.put("/categories/{category_id}")
def update_category(category_id: str, category_data: CategoryUpdate, admin_id: str = Depends(get_current_admin_id)):
    cat = controller.update_category(category_id, category_data.model_dump(exclude_unset=True))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "message": "Category updated successfully", "category": cat}


@router.patch("/categories/{category_id}/toggle")
def toggle_category_status(
    category_id: str,
    body: CategoryToggle,
    admin_id: str = Depends(get_current_admin_id)
):
    cat = controller.toggle_category_status(category_id, body.is_active)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    action = "enabled" if body.is_active else "disabled"
    return {"success": True, "message": f"Category {action} successfully", "category": cat}


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, admin_id: str = Depends(get_current_admin_id)):
    result = controller.delete_category(category_id)
    if result.get("not_found"):
        raise HTTPException(status_code=404, detail="Category not found")
    if result.get("conflict"):
        count = result.get("count", 0)
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {count} active service(s) still reference this category. "
                   f"Deactivate those services first, or use the Disable toggle instead."
        )
    return {"success": True, "message": "Category deactivated successfully"}
