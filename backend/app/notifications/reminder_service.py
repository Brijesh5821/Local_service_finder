import pytz
import logging
from datetime import datetime, timedelta
from bson import ObjectId
from app.database.connection import db
from app.utils.email_service import send_provider_booking_reminder, send_customer_booking_reminder
from app.notifications.service import create_notification

logger = logging.getLogger("sevamitra_api")

def process_booking_reminders(target_date_override: str = None) -> dict:
    """
    Finds valid/accepted/pending bookings scheduled for tomorrow (in Asia/Kolkata timezone)
    and sends reminder emails to both provider and customer if not already sent.
    """
    if target_date_override:
        tomorrow_date = target_date_override
    else:
        kolkata_tz = pytz.timezone('Asia/Kolkata')
        now_kolkata = datetime.now(kolkata_tz)
        tomorrow_date = (now_kolkata + timedelta(days=1)).strftime('%Y-%m-%d')

    valid_statuses = ["Pending", "Accepted", "Confirmed", "pending", "accepted", "confirmed"]

    query = {
        "booking_date": tomorrow_date,
        "booking_status": {"$in": valid_statuses},
        "$or": [
            {"provider_reminder_sent": {"$ne": True}},
            {"customer_reminder_sent": {"$ne": True}}
        ]
    }

    try:
        bookings = list(db.bookings.find(query))
    except Exception as e:
        logger.error(f"[REMINDER ERROR] Failed to query upcoming bookings: {e}")
        return {"error": str(e), "tomorrow_date": tomorrow_date, "total_found": 0}

    logger.info(f"[REMINDER JOB] Processing reminders for date: {tomorrow_date}. Found {len(bookings)} pending bookings.")

    provider_sent_count = 0
    customer_sent_count = 0

    for booking in bookings:
        booking_id = str(booking.get("_id"))
        customer_id = booking.get("customer_id")
        provider_id = booking.get("provider_id")
        service_id = booking.get("service_id")

        booking_date = booking.get("booking_date", tomorrow_date)
        booking_time = booking.get("booking_time", "Scheduled Time")
        booking_address = booking.get("booking_address", "Provided Address")
        notes = booking.get("notes", "")

        # Look up Customer Details
        customer_doc = None
        if customer_id:
            try:
                cust_query = {"_id": ObjectId(customer_id)} if isinstance(customer_id, str) else {"_id": customer_id}
                customer_doc = db.users.find_one(cust_query)
            except Exception as e:
                logger.warning(f"[REMINDER] Could not parse customer_id {customer_id}: {e}")

        # Look up Provider Details
        provider_doc = None
        if provider_id:
            try:
                prov_query = {"_id": ObjectId(provider_id)} if isinstance(provider_id, str) else {"_id": provider_id}
                provider_doc = db.users.find_one(prov_query)
            except Exception as e:
                logger.warning(f"[REMINDER] Could not parse provider_id {provider_id}: {e}")

        # Look up Service Details
        service_doc = None
        if service_id:
            try:
                srv_query = {"_id": ObjectId(service_id)} if isinstance(service_id, str) else {"_id": service_id}
                service_doc = db.services.find_one(srv_query)
            except Exception:
                pass

        customer_name = customer_doc.get("full_name") or customer_doc.get("name") or "Valued Customer" if customer_doc else "Valued Customer"
        customer_email = customer_doc.get("email") if customer_doc else None

        provider_name = provider_doc.get("full_name") or provider_doc.get("name") or "Service Provider" if provider_doc else "Service Provider"
        provider_email = provider_doc.get("email") if provider_doc else None

        service_name = service_doc.get("title") or service_doc.get("name") or "Booked Service" if service_doc else "Booked Service"

        # 1. Check Provider Reminder
        if not booking.get("provider_reminder_sent"):
            if provider_email:
                provider_sent = send_provider_booking_reminder(
                    provider_email=provider_email,
                    provider_name=provider_name,
                    customer_name=customer_name,
                    service_name=service_name,
                    booking_date=booking_date,
                    booking_time=booking_time,
                    booking_address=booking_address,
                    notes=notes
                )
                if provider_sent:
                    db.bookings.update_one(
                        {"_id": booking["_id"]},
                        {"$set": {"provider_reminder_sent": True, "provider_reminder_sent_at": datetime.utcnow()}}
                    )
                    provider_sent_count += 1
                    try:
                        create_notification(
                            user_id=str(provider_id),
                            title="Booking Reminder Sent",
                            message=f"Reminder email sent for tomorrow's booking with {customer_name}.",
                            notification_type="BOOKING_REMINDER",
                            booking_id=booking_id
                        )
                    except Exception:
                        pass
            else:
                logger.warning(f"[REMINDER] Provider email unavailable for booking {booking_id}")

        # 2. Check Customer Reminder
        if not booking.get("customer_reminder_sent"):
            if customer_email:
                customer_sent = send_customer_booking_reminder(
                    customer_email=customer_email,
                    customer_name=customer_name,
                    provider_name=provider_name,
                    service_name=service_name,
                    booking_date=booking_date,
                    booking_time=booking_time,
                    booking_address=booking_address,
                    notes=notes
                )
                if customer_sent:
                    db.bookings.update_one(
                        {"_id": booking["_id"]},
                        {"$set": {"customer_reminder_sent": True, "customer_reminder_sent_at": datetime.utcnow()}}
                    )
                    customer_sent_count += 1
                    try:
                        create_notification(
                            user_id=str(customer_id),
                            title="Booking Reminder Sent",
                            message=f"Reminder email sent for tomorrow's service with {provider_name}.",
                            notification_type="BOOKING_REMINDER",
                            booking_id=booking_id
                        )
                    except Exception:
                        pass
            else:
                logger.warning(f"[REMINDER] Customer email unavailable for booking {booking_id}")



    return {
        "tomorrow_date": tomorrow_date,
        "total_found": len(bookings),
        "provider_reminders_sent": provider_sent_count,
        "customer_reminders_sent": customer_sent_count
    }
