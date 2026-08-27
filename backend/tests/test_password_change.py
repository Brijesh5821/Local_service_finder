import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import client
from app.config.security import hash_password, create_access_token

class TestPasswordChange(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Override database to a test database name
        cls.db_name = "local_service_finder_test"
        cls.db = client[cls.db_name]
        
        # Monkeypatch database instances in app modules to point to the test database
        from app.database import connection
        connection.db = cls.db
        
        import app.users.routes as user_routes
        import app.auth.routes as auth_routes
        import app.auth.service as auth_service
        import app.users.repository as user_repo
        import app.auth.repository as auth_repo
        
        user_routes.db = cls.db
        auth_routes.db = cls.db
        auth_service.repository.users_collection = cls.db["users"]
        user_repo.users_collection = cls.db["users"]
        auth_repo.users_collection = cls.db["users"]
        
        cls.client = TestClient(app)

    def setUp(self):
        # Clear test users
        self.db.users.delete_many({})
        
        # Seed test user
        self.test_password = "Password123!"
        self.hashed = hash_password(self.test_password)
        self.user_id = str(self.db.users.insert_one({
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "9876543210",
            "password": self.hashed,
            "role": "User",
            "is_active": True,
            "status": "active",
            "account_status": "approved"
        }).inserted_id)
        
        # Generate login access token for test header
        self.token = create_access_token({
            "user_id": self.user_id,
            "email": "test@example.com",
            "role": "User",
            "account_status": "approved"
        })
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.db.users.delete_many({})

    @classmethod
    def tearDownClass(cls):
        client.drop_database(cls.db_name)

    def test_change_password_success(self):
        payload = {
            "current_password": self.test_password,
            "new_password": "NewSecurePassword456!",
            "confirm_password": "NewSecurePassword456!"
        }
        response = self.client.put("/users/change-password", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        
        # Check login fails with old password
        login_payload = {
            "email": "test@example.com",
            "password": self.test_password
        }
        login_response = self.client.post("/auth/login", json=login_payload)
        self.assertFalse(login_response.json()["success"])
        
        # Check login works with new password
        login_payload["password"] = "NewSecurePassword456!"
        login_response = self.client.post("/auth/login", json=login_payload)
        self.assertTrue(login_response.json()["success"])

    def test_change_password_same_password_fails(self):
        payload = {
            "current_password": self.test_password,
            "new_password": self.test_password,
            "confirm_password": self.test_password
        }
        response = self.client.put("/users/change-password", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("New password cannot be the same", response.json()["detail"])

    def test_change_password_validation_fails(self):
        payload = {
            "current_password": self.test_password,
            "new_password": "weak",
            "confirm_password": "weak"
        }
        response = self.client.put("/users/change-password", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 422)

    def test_change_password_incorrect_current_password_fails(self):
        payload = {
            "current_password": "WrongPassword123!",
            "new_password": "NewSecurePassword456!",
            "confirm_password": "NewSecurePassword456!"
        }
        response = self.client.put("/users/change-password", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Current password is incorrect.")

if __name__ == "__main__":
    unittest.main()
