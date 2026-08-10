from app.services import service

def get_services(name=None, category=None, city=None,
                 min_price=None, max_price=None, min_rating=None, availability=None, q=None):
    return service.get_services(name, category, city, min_price, max_price, min_rating, availability, q)

def get_service_by_id(service_id: str):
    return service.get_service_by_id(service_id)
