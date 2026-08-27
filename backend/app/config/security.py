# Import direct bcrypt library for hashing passwords safely
import bcrypt
# Import JWT tools from jose to encode and decode tokens
from jose import jwt
# Import datetime and timedelta to calculate expiry timestamp
from datetime import datetime, timedelta

# Import config constants from settings configuration module
from app.config.settings import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

# Safe direct bcrypt hashing helper function
def hash_password(password: str) -> str:
    # Generate a fresh random salt
    salt = bcrypt.gensalt()
    # Hash the password bytes and decode the resulting bytes back to a string
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# Safe direct bcrypt verification helper function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Try block to capture any parsing exceptions for malformed hashes
    try:
        # Check matching checkpw boolean result of plain against hashed value
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    # Return false if verify operation encounters any format issues
    except Exception:
        # Return false indicating verify failure
        return False

# Token generator helper function
def create_access_token(data: dict):
    # Copy data payload dictionary
    to_encode = data.copy()

    # Calculate token expiry time using configured expiration minutes
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Update expiration field inside token payload
    to_encode.update({"exp": expire})

    # Encode token bytes using jose jwt library and return string
    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

import re

COMMON_WEAK_PASSWORDS = {
    "12345678", "password", "password123", "123456789", "qwerty", "welcome", "admin123",
    "pass123", "123456", "12345", "1234567", "administrator", "letmein1"
}

def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "Password is too weak or commonly used."
    return True, ""