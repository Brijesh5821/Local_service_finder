from fastapi import APIRouter, Header, HTTPException, Depends, Query
from jose import jwt, JWTError
from typing import Optional
from app.providers import controller
from app.config.settings import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/providers",
    tags=["Providers"]
)


def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
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
def get_providers(
    name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    availability: Optional[str] = Query(None),
    _user_id: str = Depends(get_current_user_id)
):
    providers = controller.get_providers(name, category, city, min_price, max_price, min_rating, availability)
    # Normalize _id to id for frontend
    result = []
    for p in providers:
        p["id"] = p.pop("_id", None)
        result.append(p)
    return {"success": True, "providers": result}


@router.get("/{provider_id}")
def get_provider(provider_id: str, _user_id: str = Depends(get_current_user_id)):
    provider = controller.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider["id"] = provider.pop("_id", None)
    return {"success": True, "provider": provider}
