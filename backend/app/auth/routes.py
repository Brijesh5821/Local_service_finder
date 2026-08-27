import logging
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import controller
from app.auth.schema import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.middleware.rate_limiter import (
    login_rate_limiter,
    register_rate_limiter,
    forgot_password_rate_limiter,
    reset_password_rate_limiter
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", dependencies=[Depends(register_rate_limiter)])
def register(user: RegisterRequest):
    try:
        res = controller.register(user)
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during registration for {user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during registration.")


@router.post("/login", dependencies=[Depends(login_rate_limiter)])
def login(user: LoginRequest):
    try:
        res = controller.login(user)
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login for {user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during login.")


@router.post("/forgot-password", dependencies=[Depends(forgot_password_rate_limiter)])
def forgot_password(data: ForgotPasswordRequest):
    try:
        from app.database.connection import db
        user_doc = db.users.find_one({"email": data.email})
        if not user_doc:
            raise HTTPException(status_code=404, detail="No account found with this email address.")
            
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(minutes=15)
        
        db.users.update_one(
            {"email": data.email},
            {"$set": {
                "reset_token": token,
                "reset_token_expiry": expiry
            }}
        )
        
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        logger.info(f"[PASSWORD RESET] Request for {data.email} | Token: {token}")
        
        return {
            "success": True, 
            "message": "Password reset link has been generated.",
            "token": token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forgot-password for {data.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to process password reset request.")


@router.post("/reset-password", dependencies=[Depends(reset_password_rate_limiter)])
def reset_password(data: ResetPasswordRequest):
    try:
        from app.database.connection import db
        from app.config.security import hash_password
        
        if data.new_password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Confirm password does not match new password.")
            
        user_doc = db.users.find_one({
            "reset_token": data.token,
            "reset_token_expiry": {"$gt": datetime.utcnow()}
        })
        if not user_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
            
        hashed = hash_password(data.new_password)
        result = db.users.update_one(
            {"_id": user_doc["_id"]},
            {
                "$set": {"password": hashed},
                "$unset": {"reset_token": "", "reset_token_expiry": ""}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update password in database.")
            
        return {"success": True, "message": "Password has been reset successfully!"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reset-password: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while resetting password.")