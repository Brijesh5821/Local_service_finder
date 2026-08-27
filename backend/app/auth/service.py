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