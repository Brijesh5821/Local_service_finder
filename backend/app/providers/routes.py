# Import framework router, header, exception, dependencies, and queries
from fastapi import APIRouter, Header, HTTPException, Depends, Query
# Import JWT tools from jose to decode authentication header
from jose import jwt, JWTError
# Import Optional for type definitions
from typing import Optional
# Import providers controller for route handling logic
from app.providers import controller
# Import settings variables to access secret tokens configuration
from app.config.settings import SECRET_KEY, ALGORITHM
# Import validation schemas for request bodies
from app.providers.schema import ServiceCreateRequest, ServiceUpdateRequest, BookingStatusUpdateRequest
# Import notifications controller to retrieve provider panel updates
from app.notifications import controller as notifications_controller

# Instantiate APIRouter for plural providers route (user search APIs)
router = APIRouter(
    # Set route prefix
    prefix="/providers",
    # Set route documentation tags
    tags=["Providers"]
)

# Instantiate APIRouter for singular provider dashboard APIs
provider_router = APIRouter(
    # Set prefix to /provider
    prefix="/provider",
    # Set tag to Provider panel
    tags=["Provider Panel"]
)

# Auth dependency function to extract user ID for user role
def get_current_user_id(authorization: str = Header(...)):
    # Check if header format matches Bearer scheme
    if not authorization.startswith("Bearer "):
        # Raise 401 if header format is incorrect
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    # Split token from Bearer prefix
    token = authorization.split(" ")[1]
    # Try decoding token payload
    try:
        # Decode using SECRET_KEY and ALGORITHM settings
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Retrieve user_id from token fields
        user_id = payload.get("user_id")
        # Check if user_id exists in payload
        if not user_id:
            # Raise 401 if token payload is invalid
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Verify account status in database
        from bson import ObjectId
        from app.database.connection import db
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User account not found")

        # Check account status with compatibility fallback
        account_status = user_doc.get("account_status")
        if not account_status:
            role_lower = user_doc.get("role", "User").lower()
            if role_lower == "admin":
                account_status = "approved"
            elif user_doc.get("status") == "active":
                account_status = "approved"
            elif user_doc.get("status") == "suspended":
                account_status = "suspended"
            else:
                account_status = "pending"

        if account_status != "approved" and user_doc.get("role", "User").lower() != "admin":
            if account_status == "pending":
                raise HTTPException(status_code=403, detail="Your account is waiting for administrator approval.")
            elif account_status == "rejected":
                msg = "Your account has not been authorized by the administrator."
                rejection_reason = user_doc.get("rejection_reason")
                if rejection_reason:
                    msg += f" Reason: {rejection_reason}"
                raise HTTPException(status_code=403, detail=msg)
            elif account_status == "suspended":
                raise HTTPException(status_code=403, detail="Your account has been suspended by the administrator.")
            else:
                raise HTTPException(status_code=403, detail="Your account is not authorized.")

        # Return user ID string
        return user_id
    # Catch any JWT error during decode
    except JWTError:
        # Raise 401 for expired or invalid tokens
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Auth dependency function specifically for provider role access control
def get_current_provider_id(authorization: str = Header(...)):
    # Check Bearer format
    if not authorization.startswith("Bearer "):
        # Raise 401
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    # Retrieve token string
    token = authorization.split(" ")[1]
    # Try decoding token payload
    try:
        # Decode jwt token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Retrieve user ID string
        user_id = payload.get("user_id")
        # Retrieve user role string
        role = payload.get("role")
        # Check if user ID is missing
        if not user_id:
            # Raise 401
            raise HTTPException(status_code=401, detail="Invalid token payload")
        # Verify case-insensitive role is provider
        if not role or role.lower() != "provider":
            # Raise 403 Forbidden if not a provider
            raise HTTPException(status_code=403, detail="Only service providers can access this dashboard")
        
        # Verify account status in database
        from bson import ObjectId
        from app.database.connection import db
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Provider account not found")

        # Check account status with compatibility fallback
        account_status = user_doc.get("account_status")
        if not account_status:
            if user_doc.get("status") == "active":
                account_status = "approved"
            elif user_doc.get("status") == "suspended":
                account_status = "suspended"
            else:
                account_status = "pending"

        if account_status != "approved":
            if account_status == "pending":
                raise HTTPException(status_code=403, detail="Your account is waiting for administrator approval.")
            elif account_status == "rejected":
                msg = "Your account has not been authorized by the administrator."
                rejection_reason = user_doc.get("rejection_reason")
                if rejection_reason:
                    msg += f" Reason: {rejection_reason}"
                raise HTTPException(status_code=403, detail=msg)
            elif account_status == "suspended":
                raise HTTPException(status_code=403, detail="Your account has been suspended by the administrator.")
            else:
                raise HTTPException(status_code=403, detail="Your account is not authorized.")

        # Return provider user ID
        return user_id
    # Catch token errors
    except JWTError:
        # Raise 401
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Existing user route to search service providers
@router.get("/")
def get_providers(
    name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    availability: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: Optional[float] = Query(10.0),
    sort_by: Optional[str] = Query(None),
    page: Optional[int] = Query(1),
    limit: Optional[int] = Query(10),
    _user_id: str = Depends(get_current_user_id)
):
    # Retrieve matching providers using controller method
    res = controller.get_providers(
        name, category, city, min_price, max_price, min_rating, availability,
        lat, lng, radius, sort_by, page, limit
    )
    providers = res.get("providers", [])
    result = []
    # Loop to restructure object ID field
    for p in providers:
        # Change mongo _id to standard serializable id
        p["id"] = p.pop("_id", None)
        # Append to results list
        result.append(p)
    # Return success flag, providers list, and paging details
    import math
    total = res.get("total_count", 0)
    limit_val = res.get("limit", 10)
    total_pages = math.ceil(total / limit_val) if limit_val > 0 else 0
    return {
        "success": True,
        "providers": result,
        "total_count": total,
        "items": result,
        "total": total,
        "page": res.get("page", 1),
        "limit": limit_val,
        "total_pages": total_pages
    }

# Existing user route to get single provider profile details
@router.get("/{provider_id}")
def get_provider(provider_id: str, _user_id: str = Depends(get_current_user_id)):
    # Retrieve provider from controller database query
    provider = controller.get_provider_by_id(provider_id)
    # Check if provider document exists
    if not provider:
        # Raise 404 if provider is missing
        raise HTTPException(status_code=404, detail="Provider not found")
    # Normalize MongoDB object ID field to standard id
    provider["id"] = provider.pop("_id", None)
    # Return provider details
    return {"success": True, "provider": provider}

# Route for provider dashboard stats
@provider_router.get("/dashboard")
def get_provider_dashboard(provider_id: str = Depends(get_current_provider_id)):
    # Retrieve dashboard statistics from controller layer
    stats = controller.get_provider_dashboard_stats(provider_id)
    # Return success response with stats payload
    return {"success": True, "stats": stats}

# Route for provider incoming bookings list
@provider_router.get("/bookings")
def get_provider_bookings(provider_id: str = Depends(get_current_provider_id)):
    # Retrieve bookings list from controller layer
    bookings = controller.get_provider_bookings(provider_id)
    # Return success response with bookings list
    return {"success": True, "bookings": bookings}

# Route for provider specific booking details
@provider_router.get("/bookings/{booking_id}")
def get_provider_booking(booking_id: str, provider_id: str = Depends(get_current_provider_id)):
    # Retrieve booking details
    booking = controller.get_provider_booking_by_id(booking_id, provider_id)
    # Check if booking exists
    if not booking:
        # Raise 404 if booking doesn't exist
        raise HTTPException(status_code=404, detail="Booking not found")
    # Return success response with booking
    return {"success": True, "booking": booking}

# Route to accept a booking
@provider_router.patch("/bookings/{booking_id}/accept")
def accept_booking(booking_id: str, provider_id: str = Depends(get_current_provider_id)):
    # Call accept controller method
    booking = controller.accept_booking(booking_id, provider_id)
    # Return success response
    return {"success": True, "booking": booking}

# Route to reject a booking
@provider_router.patch("/bookings/{booking_id}/reject")
def reject_booking(booking_id: str, payload: BookingStatusUpdateRequest, provider_id: str = Depends(get_current_provider_id)):
    # Call reject controller method passing optional reason string
    booking = controller.reject_booking(booking_id, provider_id, payload.reason)
    # Return success response
    return {"success": True, "booking": booking}

# Route to accept rescheduling of a booking
@provider_router.patch("/bookings/{booking_id}/reschedule-accept")
def reschedule_accept(booking_id: str, provider_id: str = Depends(get_current_provider_id)):
    success = controller.accept_reschedule_booking(booking_id, provider_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Reschedule request not found, already processed, or booking doesn't belong to you"
        )
    return {"success": True, "message": "Reschedule request approved successfully"}

# Route to reject rescheduling of a booking
@provider_router.patch("/bookings/{booking_id}/reschedule-reject")
def reschedule_reject(booking_id: str, provider_id: str = Depends(get_current_provider_id)):
    success = controller.reject_reschedule_booking(booking_id, provider_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Reschedule request not found, already processed, or booking doesn't belong to you"
        )
    return {"success": True, "message": "Reschedule request rejected successfully"}

# Route to cancel a booking
@provider_router.patch("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: str, payload: BookingStatusUpdateRequest, provider_id: str = Depends(get_current_provider_id)):
    # Call cancel controller method passing optional reason string
    booking = controller.cancel_booking(booking_id, provider_id, payload.reason)
    # Return success response
    return {"success": True, "booking": booking}

# Route to complete a booking
@provider_router.patch("/bookings/{booking_id}/complete")
def complete_booking(booking_id: str, provider_id: str = Depends(get_current_provider_id)):
    # Call complete controller method
    booking = controller.complete_booking(booking_id, provider_id)
    # Return success response
    return {"success": True, "booking": booking}

# Route to list services offered by the provider
@provider_router.get("/services")
def get_provider_services(provider_id: str = Depends(get_current_provider_id)):
    # Retrieve services list from controller layer
    services = controller.get_provider_services(provider_id)
    # List to hold normalized services
    result = []
    # Loop to normalize keys
    for s in services:
        # Convert _id key
        s["id"] = s.pop("_id", None)
        # Append
        result.append(s)
    # Return success response
    return {"success": True, "services": result}

# Route to add a new service
@provider_router.post("/services")
def create_provider_service(payload: ServiceCreateRequest, provider_id: str = Depends(get_current_provider_id)):
    # Convert Pydantic request model to raw dictionary
    data = payload.model_dump()
    # Call creation method in controller layer
    service = controller.create_provider_service(provider_id, data)
    # Normalize ID field
    service["id"] = service.pop("_id", None)
    # Return success response with new service
    return {"success": True, "service": service}

# Route to update service details
@provider_router.put("/services/{service_id}")
def update_provider_service(service_id: str, payload: ServiceUpdateRequest, provider_id: str = Depends(get_current_provider_id)):
    # Get set update fields from payload model
    data = payload.model_dump(exclude_unset=True)
    # Call update method in controller layer
    service = controller.update_provider_service(service_id, provider_id, data)
    # Normalize ID field
    service["id"] = service.pop("_id", None)
    # Return success response
    return {"success": True, "service": service}

# Route to delete a service
@provider_router.delete("/services/{service_id}")
def delete_provider_service(service_id: str, provider_id: str = Depends(get_current_provider_id)):
    # Call deletion method in controller layer
    success = controller.delete_provider_service(service_id, provider_id)
    # Check if delete operation succeeded
    if not success:
        # Raise 400 bad request error
        raise HTTPException(status_code=400, detail="Failed to delete service")
    # Return success status
    return {"success": True, "message": "Service deleted successfully"}

# Route to fetch notifications for the provider
@provider_router.get("/notifications")
def get_provider_notifications(provider_id: str = Depends(get_current_provider_id)):
    # Fetch notifications from notifications controller using provider's user ID
    notifications = notifications_controller.get_notifications(provider_id)
    # Return success response
    return {"success": True, "notifications": notifications}


# ── PROVIDER DOCUMENT MANAGEMENT ──
import os
import shutil
import uuid
import logging
from fastapi import UploadFile, File, Form
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _validate_file_magic_bytes(header_bytes: bytes, ext: str) -> bool:
    """Validates the file header magic bytes against expected extension."""
    if ext == ".pdf":
        return header_bytes.startswith(b"%PDF-")
    elif ext in [".jpg", ".jpeg"]:
        return header_bytes.startswith(b"\xff\xd8\xff")
    elif ext == ".png":
        return header_bytes.startswith(b"\x89PNG\r\n\x1a\n") or header_bytes.startswith(b"\x89PNG")
    return False


@provider_router.post("/documents/upload")
def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    provider_id: str = Depends(get_current_provider_id)
):
    if document_type not in ["Identity Proof", "License/Certificate", "Supporting Document"]:
        raise HTTPException(status_code=400, detail="Invalid document type")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, JPEG, and PNG files are allowed")
        
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    header_bytes = file.file.read(16)
    file.file.seek(0)
    
    if not _validate_file_magic_bytes(header_bytes, ext):
        raise HTTPException(status_code=400, detail="File format mismatch. The file content does not match its extension.")

    contents = file.file.read(MAX_SIZE + 1)
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 5MB")
    file.file.seek(0)
    
    doc_id = str(uuid.uuid4())
    stored_name = f"{provider_id}_{doc_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    from app.database.connection import db
    from bson import ObjectId
    from datetime import datetime
    
    new_doc = {
        "id": doc_id,
        "document_type": document_type,
        "file_name": file.filename,
        "stored_filename": stored_name,
        "file_path": file_path,
        "status": "pending",
        "rejection_reason": "",
        "uploaded_at": datetime.utcnow().isoformat()
    }
    
    db.users.update_one(
        {"_id": ObjectId(provider_id)},
        {"$pull": {"verification_documents": {"document_type": document_type}}}
    )
    
    db.users.update_one(
        {"_id": ObjectId(provider_id)},
        {"$push": {"verification_documents": new_doc}}
    )
    
    return {"success": True, "message": "Document uploaded successfully", "document": new_doc}


@provider_router.get("/documents")
def get_my_documents(provider_id: str = Depends(get_current_provider_id)):
    from app.database.connection import db
    from bson import ObjectId
    user = db.users.find_one({"_id": ObjectId(provider_id)}, {"verification_documents": 1})
    docs = user.get("verification_documents", []) if user else []
    return {"success": True, "documents": docs}


@provider_router.get("/documents/{doc_id}/view")
def view_my_document(doc_id: str, provider_id: str = Depends(get_current_provider_id)):
    from app.database.connection import db
    from bson import ObjectId
    user = db.users.find_one({"_id": ObjectId(provider_id)}, {"verification_documents": 1})
    docs = user.get("verification_documents", []) if user else []
    match = next((d for d in docs if d["id"] == doc_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Document not found")
    
    path = match.get("file_path") or os.path.join(UPLOAD_DIR, match.get("stored_filename", match.get("file_name", "")))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(path, filename=match.get("file_name"))
