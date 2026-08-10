from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services import controller

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

@router.get("/")
def get_services(
    name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    availability: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    try:
        services = controller.get_services(name, category, city, min_price, max_price, min_rating, availability, q)
        result = []
        for s in services:
            s["id"] = s.pop("_id", None)
            result.append(s)
        return {"success": True, "services": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{service_id}")
def get_service(service_id: str):
    try:
        service = controller.get_service_by_id(service_id)
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        service["id"] = service.pop("_id", None)
        return {"success": True, "service": service}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
