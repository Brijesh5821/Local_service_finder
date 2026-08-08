from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from app.users import controller
from app.users.schema import UserProfileUpdate
from app.config.settings import SECRET_KEY, ALGORITHM

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
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/")
def get_users():
    return controller.get_users()


@router.get("/profile")
def get_profile(user_id: str = Depends(get_current_user_id)):
    profile = controller.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"success": True, "user": profile}


@router.put("/profile")
def update_profile(profile_data: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    updated_profile = controller.update_user_profile(user_id, profile_data.model_dump(exclude_unset=True))
    if not updated_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"success": True, "message": "Profile updated successfully", "user": updated_profile}