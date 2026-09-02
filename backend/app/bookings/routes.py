import logging
from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from app.bookings import controller
from app.bookings.schema import BookingCreate, BookingReschedule
from app.config.settings import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
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

        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/")
def create_booking(booking: BookingCreate, user_id: str = Depends(get_current_user_id)):
    try:
        from bson import ObjectId
        from app.database.connection import db
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("role", "").lower() in ["admin", "system_admin"]:
            raise HTTPException(status_code=403, detail="Admin users cannot create service bookings.")

        booking_doc = controller.create_booking(user_id, booking.model_dump())
        return {"success": True, "message": "Booking created successfully", "booking": booking_doc}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create booking. Please try again later.")


@router.get("/my")
def get_my_bookings(user_id: str = Depends(get_current_user_id)):
    try:
        bookings = controller.get_my_bookings(user_id)
        return {"success": True, "bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching bookings for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve bookings. Please try again later.")


@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user_id)):
    try:
        cancelled = controller.cancel_booking(booking_id, user_id)
        if not cancelled:
            raise HTTPException(
                status_code=400,
                detail="Booking not found, already cancelled, or not in Pending status."
            )
        return {"success": True, "message": "Booking cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling booking {booking_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to cancel booking. Please try again.")


@router.patch("/{booking_id}/reschedule")
def reschedule_booking(booking_id: str, reschedule_data: BookingReschedule, user_id: str = Depends(get_current_user_id)):
    try:
        rescheduled = controller.request_reschedule_booking(
            booking_id, user_id, reschedule_data.booking_date, reschedule_data.booking_time, reschedule_data.reason
        )
        if not rescheduled:
            raise HTTPException(
                status_code=400,
                detail="Booking not found, not owned by current customer, in invalid status, or invalid future date/time chosen."
            )
        return {"success": True, "message": "Reschedule requested successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rescheduling booking {booking_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reschedule booking. Please try again.")
