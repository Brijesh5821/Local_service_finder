from app.auth import repository
from app.config.security import hash_password
from app.config.security import verify_password, create_access_token


def register_user(user):

    # Check Email
    existing_user = repository.get_user_by_email(user.email)

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists"
        }

    # Check Phone
    if user.phone:
        existing_phone = repository.get_user_by_phone(user.phone)
        if existing_phone:
            return {
                "success": False,
                "message": "Phone number already exists"
            }

    # Convert Pydantic Object to Dictionary
    user_data = user.model_dump()

    # Block public registration as Admin
    role_requested = user_data.get("role", "User")
    if role_requested.lower() == "admin":
        return {
            "success": False,
            "message": "Public registration as Admin is not permitted."
        }

    # Normalize roles and set status
    if role_requested.lower() == "provider":
        user_data["role"] = "Provider"
        user_data["account_status"] = "pending"
        user_data["status"] = "pending"
        user_data["is_active"] = False
    else:
        user_data["role"] = "User"
        user_data["account_status"] = "approved"
        user_data["status"] = "active"
        user_data["is_active"] = True

    # Hash Password
    user_data["password"] = hash_password(user.password)

    # Save User with duplicate protection
    try:
        user_id = repository.create_user(user_data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"DB Error creating user: {e}", exc_info=True)
        if "duplicate key" in str(e).lower() or "dup key" in str(e).lower():
            if "phone" in str(e).lower():
                return {
                    "success": False,
                    "message": "Phone number already exists"
                }
            return {
                "success": False,
                "message": "Email already exists"
            }
        return {
            "success": False,
            "message": "An unexpected error occurred during account creation. Please try again."
        }

    return {
        "success": True,
        "message": "User Registered Successfully",
        "user_id": user_id
    }


def login_user(user):

    # Find User
    db_user = repository.get_user_by_email(user.email)

    if not db_user:
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    # Verify Password
    if not verify_password(user.password, db_user["password"]):
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    # Get account status with fallback logic for backward compatibility
    account_status = db_user.get("account_status")
    if not account_status:
        role_lower = db_user.get("role", "User").lower()
        if role_lower == "admin":
            account_status = "approved"
        elif db_user.get("status") == "active":
            account_status = "approved"
        elif db_user.get("status") == "suspended":
            account_status = "suspended"
        else:
            account_status = "pending"

    # Handle account status checks
    if account_status == "pending":
        return {
            "success": False,
            "message": "Your account is waiting for administrator approval."
        }
    elif account_status == "rejected":
        msg = "Your account has not been authorized by the administrator."
        rejection_reason = db_user.get("rejection_reason")
        if rejection_reason:
            msg += f" Reason: {rejection_reason}"
        return {
            "success": False,
            "message": msg
        }
    elif account_status == "suspended":
        return {
            "success": False,
            "message": "Your account has been suspended by the administrator."
        }
    elif account_status != "approved":
        return {
            "success": False,
            "message": "Your account is not authorized."
        }

    # Generate JWT Token
    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"],
        "role": db_user["role"],
        "full_name": db_user.get("full_name", ""),
        "account_status": account_status
    })

    return {
        "success": True,
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer"
    }


def google_login_user(token: str):
    import logging
    import os
    import re
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.config.settings import GOOGLE_CLIENT_ID

    logger = logging.getLogger(__name__)

    if not token or not isinstance(token, str) or not token.strip():
        return {
            "success": False,
            "message": "Google authentication token is required."
        }

    # 1. Verify Google token using official Google verification library
    try:
        req = google_requests.Request()
        client_id = GOOGLE_CLIENT_ID or os.getenv("GOOGLE_CLIENT_ID") or None

        id_info = id_token.verify_oauth2_token(token, req, audience=client_id if client_id else None)

        iss = id_info.get("iss")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            return {
                "success": False,
                "message": "Invalid token issuer."
            }
    except ValueError as e:
        logger.warning(f"Google ID token verification failed: {e}")
        return {
            "success": False,
            "message": "Invalid or expired Google token."
        }
    except Exception as e:
        logger.error(f"Error verifying Google ID token: {e}", exc_info=True)
        return {
            "success": False,
            "message": "Google authentication verification failed."
        }

    google_sub = id_info.get("sub")
    email = id_info.get("email")
    email_verified = id_info.get("email_verified", True)
    full_name = id_info.get("name") or (f"{id_info.get('given_name', '')} {id_info.get('family_name', '')}").strip() or email.split("@")[0]
    picture = id_info.get("picture", "")

    if not google_sub or not email:
        return {
            "success": False,
            "message": "Google token missing required profile information."
        }

    if not email_verified:
        return {
            "success": False,
            "message": "Google email address is not verified."
        }

    email_clean = email.strip().lower()

    # 2. User lookup by google_sub / google_id
    db_user = repository.get_user_by_google_sub(google_sub)

    if not db_user:
        # Check if an account already exists with the same email
        existing_email_user = repository.get_user_by_email(email_clean)
        if not existing_email_user:
            from app.database.connection import db
            existing_email_user = db.users.find_one({"email": {"$regex": f"^{re.escape(email_clean)}$", "$options": "i"}})

        if existing_email_user:
            # Account linking: link Google ID to existing account
            db_user = existing_email_user
            updates = {
                "google_sub": google_sub,
                "google_id": google_sub
            }
            if not db_user.get("profile_image") and picture:
                updates["profile_image"] = picture
            repository.update_user_google_info(db_user["_id"], updates)
            db_user["google_sub"] = google_sub
            db_user["google_id"] = google_sub
        else:
            # Create a NEW normal User account (strictly "User" role)
            new_user_data = {
                "full_name": full_name,
                "email": email_clean,
                "role": "User",
                "account_status": "approved",
                "status": "active",
                "is_active": True,
                "google_sub": google_sub,
                "google_id": google_sub,
                "profile_image": picture,
                "phone": "",
                "password": ""
            }
            user_id = repository.create_user(new_user_data)
            db_user = repository.get_user_by_id(user_id)

    # 3. Handle account status checks
    account_status = db_user.get("account_status")
    if not account_status:
        role_lower = db_user.get("role", "User").lower()
        if role_lower == "admin":
            account_status = "approved"
        elif db_user.get("status") == "active":
            account_status = "approved"
        elif db_user.get("status") == "suspended":
            account_status = "suspended"
        else:
            account_status = "pending"

    if account_status == "pending":
        return {
            "success": False,
            "message": "Your account is waiting for administrator approval."
        }
    elif account_status == "rejected":
        msg = "Your account has not been authorized by the administrator."
        rejection_reason = db_user.get("rejection_reason")
        if rejection_reason:
            msg += f" Reason: {rejection_reason}"
        return {
            "success": False,
            "message": msg
        }
    elif account_status == "suspended":
        return {
            "success": False,
            "message": "Your account has been suspended by the administrator."
        }
    elif account_status != "approved":
        return {
            "success": False,
            "message": "Your account is not authorized."
        }

    # 4. Generate JWT Token
    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"],
        "role": db_user["role"],
        "full_name": db_user.get("full_name", ""),
        "account_status": account_status
    })

    return {
        "success": True,
        "message": "Google Login Successful",
        "access_token": token,
        "token_type": "bearer"
    }
