from app.services import repository

def get_services(name=None, category=None, city=None,
                 min_price=None, max_price=None, min_rating=None, availability=None,
                 q=None, lat=None, lng=None, radius=10.0, sort_by=None, page=1, limit=10):
    return repository.get_services(name, category, city, min_price, max_price, min_rating, availability, q, lat, lng, radius, sort_by, page, limit)

def get_service_by_id(service_id: str):
    return repository.get_service_by_id(service_id)
