import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import pytz
import random
from bson import ObjectId

from app.database.connection import db
from app.config.settings import GMAIL_USER, GMAIL_APP_PASSWORD
from app.notifications.reminder_service import process_booking_reminders

class TestEmailReminders(unittest.TestCase):
    def setUp(self):
        # Calculate tomorrow's date string in Asia/Kolkata
        self.kolkata_tz = pytz.timezone('Asia/Kolkata')
        self.now_kolkata = datetime.now(self.kolkata_tz)
        self.tomorrow_str = (self.now_kolkata + timedelta(days=1)).strftime('%Y-%m-%d')
        self.day_after_tomorrow_str = (self.now_kolkata + timedelta(days=2)).strftime('%Y-%m-%d')

        random_suffix = random.randint(100000, 999999)
        self.cust_email = f"rahul.{random_suffix}@example.com"
        self.prov_email = f"nishit.{random_suffix}@example.com"
        cust_phone = f"+919876{random_suffix}"
        prov_phone = f"+919875{random_suffix}"

        # Insert test customer user
        self.customer_id = db.users.insert_one({
            "full_name": "Rahul Patel",
            "email": self.cust_email,
            "phone": cust_phone,
            "role": "Customer",
            "status": "active"
        }).inserted_id

        # Insert test provider user
        self.provider_id = db.users.insert_one({
            "full_name": "Nishit Mehta",
            "email": self.prov_email,
            "phone": prov_phone,
            "role": "Provider",
            "status": "active"
        }).inserted_id

        # Insert test service
        self.service_id = db.services.insert_one({
            "title": "Professional Painter Work",
            "category": "Painter"
        }).inserted_id

    def tearDown(self):
        # Clean up inserted test documents
        db.users.delete_many({"_id": {"$in": [self.customer_id, self.provider_id]}})
        db.services.delete_one({"_id": self.service_id})
        db.bookings.delete_many({"customer_id": str(self.customer_id)})

    @patch("app.utils.email_service.send_email")
    def test_1_valid_tomorrow_booking_sends_reminders(self, mock_send_email):
        mock_send_email.return_value = True

        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(self.provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "notes": "Please bring ladder",
            "booking_status": "Accepted",
            "provider_reminder_sent": False,
            "customer_reminder_sent": False
        }).inserted_id

        stats = process_booking_reminders(target_date_override=self.tomorrow_str)

        self.assertGreaterEqual(stats["provider_reminders_sent"], 1)
        self.assertGreaterEqual(stats["customer_reminders_sent"], 1)
        self.assertGreaterEqual(mock_send_email.call_count, 2)

        # Verify DB flags updated
        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertTrue(updated_booking.get("provider_reminder_sent"))
        self.assertTrue(updated_booking.get("customer_reminder_sent"))

        # Verify in-app dashboard notification was created for reminder emails
        reminder_notifs = db.notifications.count_documents({
            "notification_type": "BOOKING_REMINDER",
            "booking_id": str(booking_id)
        })
        self.assertGreaterEqual(reminder_notifs, 1)



    @patch("app.utils.email_service.send_email")
    def test_2_duplicate_prevention(self, mock_send_email):
        mock_send_email.return_value = True

        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(self.provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "booking_status": "Accepted",
            "provider_reminder_sent": True,
            "customer_reminder_sent": True
        }).inserted_id

        stats = process_booking_reminders(target_date_override=self.tomorrow_str)

        # The test booking itself will not trigger reminders
        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertTrue(updated_booking.get("provider_reminder_sent"))
        self.assertTrue(updated_booking.get("customer_reminder_sent"))

    @patch("app.utils.email_service.send_email")
    def test_3_rejected_booking_no_reminder(self, mock_send_email):
        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(self.provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "booking_status": "Rejected",
            "provider_reminder_sent": False,
            "customer_reminder_sent": False
        }).inserted_id

        process_booking_reminders(target_date_override=self.tomorrow_str)

        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertFalse(updated_booking.get("provider_reminder_sent"))
        self.assertFalse(updated_booking.get("customer_reminder_sent"))

    @patch("app.utils.email_service.send_email")
    def test_4_cancelled_booking_no_reminder(self, mock_send_email):
        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(self.provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "booking_status": "Cancelled",
            "provider_reminder_sent": False,
            "customer_reminder_sent": False
        }).inserted_id

        process_booking_reminders(target_date_override=self.tomorrow_str)

        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertFalse(updated_booking.get("provider_reminder_sent"))
        self.assertFalse(updated_booking.get("customer_reminder_sent"))

    @patch("app.utils.email_service.send_email")
    def test_5_other_date_booking_no_reminder(self, mock_send_email):
        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(self.provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.day_after_tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "booking_status": "Accepted",
            "provider_reminder_sent": False,
            "customer_reminder_sent": False
        }).inserted_id

        process_booking_reminders(target_date_override=self.tomorrow_str)

        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertFalse(updated_booking.get("provider_reminder_sent"))
        self.assertFalse(updated_booking.get("customer_reminder_sent"))

    @patch("app.utils.email_service.send_email")
    def test_6_missing_email_handled_safely(self, mock_send_email):
        mock_send_email.return_value = True

        no_email_phone = f"+919874{random.randint(100000, 999999)}"
        no_email_provider_id = db.users.insert_one({
            "full_name": "No Email Provider",
            "email": None,
            "phone": no_email_phone,
            "role": "Provider",
            "status": "active"
        }).inserted_id

        booking_id = db.bookings.insert_one({
            "customer_id": str(self.customer_id),
            "provider_id": str(no_email_provider_id),
            "service_id": str(self.service_id),
            "booking_date": self.tomorrow_str,
            "booking_time": "10:00 AM",
            "booking_address": "123 Main Street, Ahmedabad",
            "booking_status": "Accepted",
            "provider_reminder_sent": False,
            "customer_reminder_sent": False
        }).inserted_id

        process_booking_reminders(target_date_override=self.tomorrow_str)

        updated_booking = db.bookings.find_one({"_id": booking_id})
        self.assertFalse(updated_booking.get("provider_reminder_sent"))
        self.assertTrue(updated_booking.get("customer_reminder_sent"))

        db.users.delete_one({"_id": no_email_provider_id})

    def test_7_gmail_credentials_environment_check(self):
        self.assertIsNotNone(GMAIL_USER)
        self.assertIsNotNone(GMAIL_APP_PASSWORD)


if __name__ == "__main__":
    unittest.main()
