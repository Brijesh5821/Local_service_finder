from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from app.bookings import controller
from app.bookings.schema import BookingCreate
from app.config.settings import SECRET_KEY, ALGORITHM

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
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/")
def create_booking(booking: BookingCreate, user_id: str = Depends(get_current_user_id)):
    booking_doc = controller.create_booking(user_id, booking.model_dump())
    return {"success": True, "message": "Booking created successfully", "booking": booking_doc}


@router.get("/my")
def get_my_bookings(user_id: str = Depends(get_current_user_id)):
    bookings = controller.get_my_bookings(user_id)
    return {"success": True, "bookings": bookings}


@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user_id)):
    cancelled = controller.cancel_booking(booking_id, user_id)
    if not cancelled:
        raise HTTPException(
            status_code=400,
            detail="Booking not found, already cancelled, or not in Pending status"
        )
    return {"success": True, "message": "Booking cancelled successfully"}
