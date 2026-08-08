from app.providers import service


def get_providers(name=None, category=None, city=None,
                  min_price=None, max_price=None, min_rating=None, availability=None):
    return service.get_providers(name, category, city, min_price, max_price, min_rating, availability)


def get_provider_by_id(provider_id: str):
    return service.get_provider_by_id(provider_id)
