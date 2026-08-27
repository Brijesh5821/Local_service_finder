import logging
from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from app.users import controller
from app.users.schema import UserProfileUpdate, UserSettingsUpdate
from app.auth.schema import ChangePasswordRequest
from app.config.settings import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Verify account status in database
        from bson import ObjectId
        from app.database.connection import db
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User account not found")
        
        # Check account status with compatibility fallback
        account_status = user_doc.get("account_status")
        if not account_status:
            role_lower = user_doc.get("role", "User").lower()
            if role_lower == "admin":
                account_status = "approved"
            elif user_doc.get("status") == "active":
                account_status = "approved"
            elif user_doc.get("status") == "suspended":
                account_status = "suspended"
            else:
                account_status = "pending"

        if account_status != "approved" and user_doc.get("role", "User").lower() != "admin":
            if account_status == "pending":
                raise HTTPException(status_code=403, detail="Your account is waiting for administrator approval.")
            elif account_status == "rejected":
                msg = "Your account has not been authorized by the administrator."
                rejection_reason = user_doc.get("rejection_reason")
                if rejection_reason:
                    msg += f" Reason: {rejection_reason}"
                raise HTTPException(status_code=403, detail=msg)
            elif account_status == "suspended":
                raise HTTPException(status_code=403, detail="Your account has been suspended by the administrator.")
            else:
                raise HTTPException(status_code=403, detail="Your account is not authorized.")

        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/profile")
def get_profile(user_id: str = Depends(get_current_user_id)):
    try:
        profile = controller.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        return {"success": True, "user": profile}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve user profile.")


@router.put("/profile")
def update_profile(profile_data: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    try:
        updated_profile = controller.update_user_profile(user_id, profile_data.model_dump(exclude_unset=True))
        if not updated_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        return {"success": True, "message": "Profile updated successfully", "user": updated_profile}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update profile.")


@router.put("/change-password")
def change_password(data: ChangePasswordRequest, user_id: str = Depends(get_current_user_id)):
    try:
        from bson import ObjectId
        from app.database.connection import db
        from app.config.security import verify_password, hash_password
        
        if data.new_password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Confirm password does not match new password.")
            
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found.")
            
        if not verify_password(data.current_password, user_doc["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
            
        if verify_password(data.new_password, user_doc["password"]):
            raise HTTPException(status_code=400, detail="New password cannot be the same as current password.")
            
        hashed = hash_password(data.new_password)
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed}}
        )
        
        if result.modified_count == 0:
            user_after = db.users.find_one({"_id": ObjectId(user_id)})
            if verify_password(data.new_password, user_after["password"]):
                return {"success": True, "message": "Password updated successfully!"}
            raise HTTPException(status_code=500, detail="Failed to update password.")
            
        return {"success": True, "message": "Password updated successfully!"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while changing password.")


@router.put("/settings")
def update_settings(data: UserSettingsUpdate, user_id: str = Depends(get_current_user_id)):
    try:
        settings_data = data.model_dump(exclude_unset=True)
        res = controller.update_user_settings(user_id, settings_data)
        return {"success": True, "message": "Settings updated successfully", "preferences": res}
    except Exception as e:
        logger.error(f"Error updating settings for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update settings.")


import os
import uuid
import io
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    Image = None
    HAS_PIL = False

from fastapi import UploadFile, File

PROFILE_IMG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "profile_images")
os.makedirs(PROFILE_IMG_DIR, exist_ok=True)

def _remove_existing_user_image(user_id: str):
    try:
        from app.database.connection import db
        from bson import ObjectId
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("profile_image"):
            current_url = user_doc["profile_image"]
            if "/uploads/profile_images/" in current_url:
                filename = current_url.split("/uploads/profile_images/")[-1]
                old_path = os.path.join(PROFILE_IMG_DIR, filename)
                if os.path.exists(old_path):
                    os.remove(old_path)
    except Exception as e:
        logger.warning(f"Could not clean up existing profile image for user {user_id}: {e}")

@router.post("/profile-image")
def upload_profile_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    try:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
        if file.content_type and file.content_type.lower() not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF."
            )

        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid image extension. Allowed extensions: .jpg, .jpeg, .png, .webp, .gif"
            )

        contents = file.file.read()
        max_size = 5 * 1024 * 1024  # 5MB
        if len(contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail="Image file size exceeds maximum limit of 5MB."
            )

        # Validate actual image content using Pillow if available
        if HAS_PIL and Image:
            try:
                img = Image.open(io.BytesIO(contents))
                img.load()
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded file is not a valid or readable image."
                )

        # Clean up existing image file before saving new one
        _remove_existing_user_image(user_id)

        stored_filename = f"{user_id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(PROFILE_IMG_DIR, stored_filename)

        with open(file_path, "wb") as f:
            f.write(contents)

        image_url = f"http://localhost:8000/uploads/profile_images/{stored_filename}"

        from app.database.connection import db
        from bson import ObjectId
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_image": image_url}}
        )

        return {
            "success": True,
            "message": "Profile image uploaded successfully",
            "profile_image": image_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile image for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload profile image.")


@router.delete("/profile-image")
def delete_profile_image(
    user_id: str = Depends(get_current_user_id)
):
    try:
        _remove_existing_user_image(user_id)
        from app.database.connection import db
        from bson import ObjectId
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_image": ""}}
        )
        return {
            "success": True,
            "message": "Profile image removed successfully",
            "profile_image": ""
        }
    except Exception as e:
        logger.error(f"Error removing profile image for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to remove profile image.")