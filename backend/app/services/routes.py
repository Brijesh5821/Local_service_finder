import logging
import math
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services import controller

logger = logging.getLogger(__name__)

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
    q: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: Optional[float] = Query(10.0),
    sort_by: Optional[str] = Query(None),
    page: Optional[int] = Query(1),
    limit: Optional[int] = Query(10)
):
    try:
        res = controller.get_services(
            name, category, city, min_price, max_price, min_rating, availability, q,
            lat, lng, radius, sort_by, page, limit
        )
        services = res.get("services", [])
        result = []
        for s in services:
            s["id"] = s.pop("_id", None)
            result.append(s)
            
        total = res.get("total_count", 0)
        limit_val = res.get("limit", 10)
        total_pages = math.ceil(total / limit_val) if limit_val > 0 else 0
        return {
            "success": True,
            "services": result,
            "total_count": total,
            "items": result,
            "total": total,
            "page": res.get("page", 1),
            "limit": limit_val,
            "total_pages": total_pages
        }
    except Exception as e:
        logger.error(f"Error fetching services: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve service listings. Please try again later.")

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
        logger.error(f"Error fetching service {service_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve service details. Please try again later.")
