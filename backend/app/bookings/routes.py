import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Depends, Query
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


@router.get("/slots")
def get_available_time_slots(
    provider_id: str = Query(...),
    service_id: Optional[str] = Query(None),
    date: str = Query(...)
):
    try:
        from datetime import datetime
        from bson import ObjectId
        from app.database.connection import db

        try:
            dt = datetime.strptime(date, "%Y-%m-%d")
            weekday_name = dt.strftime("%A").lower()
            full_day_name = dt.strftime("%A")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

        users_col = db["users"]
        services_col = db["services"]
        bookings_col = db["bookings"]

        provider = users_col.find_one({"_id": ObjectId(provider_id)}) if ObjectId.is_valid(provider_id) else None
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")

        holidays = provider.get("holidays") or []
        if date in holidays:
            return {"success": True, "date": date, "day": full_day_name, "is_holiday": True, "slots": []}

        # Retrieve availability configuration from service or provider
        availability = None
        if service_id and ObjectId.is_valid(service_id):
            srv = services_col.find_one({"_id": ObjectId(service_id)})
            if srv and srv.get("availability"):
                availability = srv.get("availability")

        if not availability:
            availability = provider.get("availability") or []

        # Parse configured slots for weekday_name
        configured_slots = []

        if isinstance(availability, list):
            day_config = next((d for d in availability if isinstance(d, dict) and d.get("day", "").lower() == weekday_name), None)
            if day_config and day_config.get("slots"):
                for s in day_config["slots"]:
                    if isinstance(s, dict):
                        start_time = s.get("startTime") or s.get("start_time")
                        end_time = s.get("endTime") or s.get("end_time")
                        if start_time and end_time:
                            configured_slots.append({"startTime": start_time, "endTime": end_time})
                    elif isinstance(s, str) and "-" in s:
                        parts = s.split("-")
                        configured_slots.append({"startTime": parts[0].strip(), "endTime": parts[1].strip()})
        elif isinstance(availability, dict):
            if weekday_name in availability:
                for s in availability[weekday_name]:
                    if isinstance(s, str) and "-" in s:
                        parts = s.split("-")
                        configured_slots.append({"startTime": parts[0].strip(), "endTime": parts[1].strip()})

        # Fetch existing active bookings for this date and provider/service
        query_filter = {
            "provider_id": provider_id,
            "booking_date": date,
            "booking_status": {"$in": ["Pending", "Accepted"]}
        }

        existing_bookings = list(bookings_col.find(query_filter))
        booked_times = set(b.get("booking_time") for b in existing_bookings if b.get("booking_time"))

        def format_12h(t_str):
            try:
                parts = t_str.split(":")
                h = int(parts[0])
                m = parts[1]
                ampm = "AM" if h < 12 else "PM"
                disp_h = h % 12 or 12
                return f"{disp_h:02d}:{m} {ampm}"
            except Exception:
                return t_str

        result_slots = []
        for slot in configured_slots:
            s_time = slot["startTime"]
            e_time = slot["endTime"]
            label = f"{format_12h(s_time)} - {format_12h(e_time)}"
            
            # Slot is unavailable if s_time or label is booked
            is_booked = (s_time in booked_times) or (label in booked_times)
            result_slots.append({
                "startTime": s_time,
                "endTime": e_time,
                "label": label,
                "available": not is_booked
            })

        return {
            "success": True,
            "date": date,
            "day": full_day_name,
            "is_holiday": False,
            "slots": result_slots
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available slots: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate available time slots.")


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
