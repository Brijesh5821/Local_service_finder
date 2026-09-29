import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import db
from jose import jwt
from app.config.settings import SECRET_KEY, ALGORITHM

client = TestClient(app)

TEST_GOOGLE_SUB = "google_test_sub_123456789"
TEST_GOOGLE_EMAIL = "googleuser@example.com"
TEST_GOOGLE_NAME = "Google Test User"


@pytest.fixture(autouse=True)
def cleanup_test_user():
    # Clean up test user records before and after tests
    db.users.delete_many({"$or": [{"email": TEST_GOOGLE_EMAIL}, {"google_sub": TEST_GOOGLE_SUB}]})
    yield
    db.users.delete_many({"$or": [{"email": TEST_GOOGLE_EMAIL}, {"google_sub": TEST_GOOGLE_SUB}]})


def mock_verify_google_token_success(token, request_obj, audience=None):
    if token == "invalid_token":
        raise ValueError("Invalid token")
    return {
        "sub": TEST_GOOGLE_SUB,
        "email": TEST_GOOGLE_EMAIL,
        "email_verified": True,
        "name": TEST_GOOGLE_NAME,
        "picture": "https://example.com/photo.jpg",
        "iss": "https://accounts.google.com"
    }


class TestGoogleAuth:

    @patch("google.oauth2.id_token.verify_oauth2_token", side_effect=mock_verify_google_token_success)
    def test_google_login_new_user_creation(self, mock_verify):
        response = client.post("/auth/google", json={"token": "valid_token_123"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Decode token to verify contents
        token = data["access_token"]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["email"] == TEST_GOOGLE_EMAIL
        assert payload["role"] == "User"

        # Verify DB record
        user_doc = db.users.find_one({"email": TEST_GOOGLE_EMAIL})
        assert user_doc is not None
        assert user_doc["role"] == "User"
        assert user_doc["google_sub"] == TEST_GOOGLE_SUB
        assert user_doc["account_status"] == "approved"

    @patch("google.oauth2.id_token.verify_oauth2_token", side_effect=mock_verify_google_token_success)
    def test_google_login_existing_user_no_duplicate(self, mock_verify):
        # First login - creates user
        res1 = client.post("/auth/google", json={"token": "valid_token_123"})
        assert res1.json()["success"] is True

        # Second login - authenticates existing user
        res2 = client.post("/auth/google", json={"token": "valid_token_123"})
        assert res2.json()["success"] is True

        # Check total matching users in DB
        count = db.users.count_documents({"email": TEST_GOOGLE_EMAIL})
        assert count == 1

    @patch("google.oauth2.id_token.verify_oauth2_token", side_effect=mock_verify_google_token_success)
    def test_google_login_account_linking_by_email(self, mock_verify):
        # Create existing user with email password first
        db.users.insert_one({
            "full_name": "Existing User",
            "email": TEST_GOOGLE_EMAIL,
            "password": "HashedPassword123",
            "role": "User",
            "account_status": "approved",
            "status": "active",
            "is_active": True
        })

        # Login with Google using same email
        res = client.post("/auth/google", json={"token": "valid_token_123"})
        assert res.json()["success"] is True

        # Check user record was linked with google_sub without creating duplicate
        count = db.users.count_documents({"email": TEST_GOOGLE_EMAIL})
        assert count == 1

        updated_user = db.users.find_one({"email": TEST_GOOGLE_EMAIL})
        assert updated_user["google_sub"] == TEST_GOOGLE_SUB

    @patch("google.oauth2.id_token.verify_oauth2_token", side_effect=mock_verify_google_token_success)
    def test_google_login_suspended_user_blocked(self, mock_verify):
        # Create suspended user
        db.users.insert_one({
            "full_name": "Suspended User",
            "email": TEST_GOOGLE_EMAIL,
            "role": "User",
            "account_status": "suspended",
            "status": "suspended",
            "google_sub": TEST_GOOGLE_SUB
        })

        res = client.post("/auth/google", json={"token": "valid_token_123"})
        data = res.json()
        assert data["success"] is False
        assert "suspended" in data["message"].lower()

    def test_google_login_invalid_token(self):
        res = client.post("/auth/google", json={"token": "invalid_token"})
        data = res.json()
        assert data["success"] is False
        assert "invalid" in data["message"].lower()
