from app.users import repository


def get_users():
    return repository.get_users()