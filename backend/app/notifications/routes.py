# Import dependencies from fastapi to build router and parse requests
from fastapi import APIRouter, Header, HTTPException, Depends
# Import JWT modules from jose to decode authentication tokens
from jose import jwt, JWTError
# Import controller handlers to execute notification queries
from app.notifications import controller
# Import SECRET_KEY and ALGORITHM from settings configuration
from app.config.settings import SECRET_KEY, ALGORITHM

# Instantiate an APIRouter for notification endpoints
router = APIRouter(
    # Set route prefix for all endpoints
    prefix="/notifications",
    # Group routes under the Notifications tag
    tags=["Notifications"]
)

# Auth dependency to validate JWT token and extract user ID
def get_current_user_id(authorization: str = Header(...)):
    # Check if the header starts with "Bearer " prefix
    if not authorization.startswith("Bearer "):
        # Raise HTTP 401 Unauthorized if prefix is missing
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    # Split token from Bearer prefix string
    token = authorization.split(" ")[1]
    # Try decoding token with SECRET_KEY and ALGORITHM
    try:
        # Decode and verify the payload using settings keys
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Retrieve user_id from the decoded payload structure
        user_id = payload.get("user_id")
        # Check if user_id key was present
        if not user_id:
            # Raise 401 if user ID is missing from payload
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
    # Catch any JWT decoding exceptions
    except JWTError:
        # Raise 401 if token is expired or altered
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Endpoint to fetch user notifications
@router.get("/")
# Endpoint receives current user ID from auth dependency
def get_notifications(user_id: str = Depends(get_current_user_id)):
    # Call controller method to retrieve notifications list
    notifications = controller.get_notifications(user_id)
    # Return success flag and notifications list payload
    return {"success": True, "notifications": notifications}

# Endpoint to mark a notification as read
@router.patch("/{notification_id}/read")
# Endpoint receives notification ID from path and user ID from dependency
def mark_as_read(notification_id: str, user_id: str = Depends(get_current_user_id)):
    # Update notification state in DB via controller call
    success = controller.mark_as_read(notification_id, user_id)
    # Check if DB update succeeded
    if not success:
        # Raise HTTP 400 Bad Request if update failed or unauthorized
        raise HTTPException(status_code=400, detail="Notification not found or access denied")
    # Return success message
    return {"success": True, "message": "Notification marked as read"}
