from fastapi import APIRouter, Header, HTTPException, Depends
from jose import jwt, JWTError
from app.reviews import controller
from app.reviews.schema import ReviewCreate
from app.config.settings import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews & Ratings"]
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

@router.post("/")
def add_review(review: ReviewCreate, user_id: str = Depends(get_current_user_id)):
    res = controller.add_review(user_id, review.model_dump())
    res["id"] = str(res.pop("_id", None))
    return {"success": True, "message": "Review submitted successfully", "review": res}

@router.get("/provider/{provider_id}")
def get_reviews_by_provider(provider_id: str):
    reviews = controller.get_reviews_by_provider(provider_id)
    for r in reviews:
        r["id"] = r.pop("_id", None)
    return {"success": True, "reviews": reviews}

@router.get("/booking/{booking_id}")
def get_review_by_booking(booking_id: str, user_id: str = Depends(get_current_user_id)):
    review = controller.get_review_by_booking(booking_id)
    if review:
        review["id"] = review.pop("_id", None)
        return {"success": True, "review": review}
    return {"success": False, "message": "No review found for this booking"}
