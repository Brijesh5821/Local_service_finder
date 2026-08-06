from fastapi import APIRouter
from app.users import controller

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/")
def get_users():
    return controller.get_users()