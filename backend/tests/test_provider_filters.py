import unittest
import random
from datetime import datetime
from bson import ObjectId

from app.database.connection import db
from app.providers.repository import get_providers, parse_time_to_minutes, is_provider_available_at_time, get_categories

class TestProviderFilters(unittest.TestCase):
    def setUp(self):
        rand_id = random.randint(10000, 99999)
        self.painter_phone = f"+919811{rand_id}"
        self.plumber_phone = f"+919812{rand_id}"

        # Insert painter provider
        self.painter_id = db.users.insert_one({
            "full_name": f"Test Painter {rand_id}",
            "email": f"painter{rand_id}@example.com",
            "phone": self.painter_phone,
            "role": "Provider",
            "provider_category": "Painter",
            "city": "Ahmedabad",
            "hourly_rate": 45.0,
            "average_rating": 4.5,
            "availability": {
                "wednesday": ["09:00-18:00"]
            },
            "status": "active",
            "account_status": "approved"
        }).inserted_id

        # Insert plumber provider
        self.plumber_id = db.users.insert_one({
            "full_name": f"Test Plumber {rand_id}",
            "email": f"plumber{rand_id}@example.com",
            "phone": self.plumber_phone,
            "role": "Provider",
            "provider_category": "Plumber",
            "city": "Ahmedabad",
            "hourly_rate": 50.0,
            "average_rating": 4.8,
            "availability": {
                "wednesday": ["09:00-18:00"]
            },
            "status": "active",
            "account_status": "approved"
        }).inserted_id

    def tearDown(self):
        db.users.delete_many({"_id": {"$in": [self.painter_id, self.plumber_id]}})
        db.bookings.delete_many({"provider_id": {"$in": [str(self.painter_id), str(self.plumber_id)]}})

    def test_1_category_painter_filter(self):
        res = get_providers(category="Painter")
        provider_ids = [p["_id"] for p in res["providers"]]
        self.assertIn(str(self.painter_id), provider_ids)
        self.assertNotIn(str(self.plumber_id), provider_ids)

    def test_2_category_plumber_filter(self):
        res = get_providers(category="Plumber")
        provider_ids = [p["_id"] for p in res["providers"]]
        self.assertIn(str(self.plumber_id), provider_ids)
        self.assertNotIn(str(self.painter_id), provider_ids)

    def test_3_category_and_city_filter(self):
        res = get_providers(category="Painter", city="Ahmedabad")
        provider_ids = [p["_id"] for p in res["providers"]]
        self.assertIn(str(self.painter_id), provider_ids)
        self.assertNotIn(str(self.plumber_id), provider_ids)

    def test_4_date_time_slot_filter(self):
        # 30 September 2026 is a Wednesday
        res = get_providers(date="2026-09-30", start_time="16:00", end_time="18:00")
        provider_ids = [p["_id"] for p in res["providers"]]
        self.assertIn(str(self.painter_id), provider_ids)
        self.assertIn(str(self.plumber_id), provider_ids)

    def test_5_category_date_time_combined(self):
        res = get_providers(category="Painter", date="2026-09-30", start_time="16:00", end_time="18:00")
        provider_ids = [p["_id"] for p in res["providers"]]
        self.assertIn(str(self.painter_id), provider_ids)
        self.assertNotIn(str(self.plumber_id), provider_ids)

    def test_6_booking_conflict_prevention(self):
        # Add booking for painter on 30 Sep 2026 from 4:00 PM to 5:00 PM
        db.bookings.insert_one({
            "provider_id": str(self.painter_id),
            "booking_date": "2026-09-30",
            "booking_time": "16:00 - 17:00",
            "booking_status": "Accepted"
        })

        # Search overlapping slot 4:30 PM - 5:30 PM
        res = get_providers(date="2026-09-30", start_time="16:30", end_time="17:30")
        provider_ids = [p["_id"] for p in res["providers"]]
        
        # Painter MUST NOT appear because of booking conflict
        self.assertNotIn(str(self.painter_id), provider_ids)

    def test_7_parse_time_to_minutes(self):
        self.assertEqual(parse_time_to_minutes("16:00"), 960)
        self.assertEqual(parse_time_to_minutes("4:00 PM"), 960)
        self.assertEqual(parse_time_to_minutes("04:00 PM"), 960)
        self.assertEqual(parse_time_to_minutes("18:00"), 1080)
        self.assertEqual(parse_time_to_minutes("6:00 PM"), 1080)

    def test_8_all_categories(self):
        cats = get_categories()
        self.assertIn("Painter", cats)
        self.assertIn("Plumber", cats)

    def test_9_no_date_time_returns_results(self):
        res = get_providers()
        self.assertGreater(res["total_count"], 0)


if __name__ == "__main__":
    unittest.main()
