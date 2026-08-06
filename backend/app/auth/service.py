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

    # Convert Pydantic Object to Dictionary
    user_data = user.model_dump()

    # Hash Password
    user_data["password"] = hash_password(user.password)

    # Save User
    user_id = repository.create_user(user_data)

    return {
        "success": True,
        "message": "User Registered Successfully",
        "user_id": user_id
    }

from app.config.security import verify_password, create_access_token


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

    # Generate JWT Token
    token = create_access_token({
        "user_id": str(db_user["_id"]),
        "email": db_user["email"],
        "role": db_user["role"]
    })

    return {
        "success": True,
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer"
    }