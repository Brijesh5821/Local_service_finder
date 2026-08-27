from app.users import repository


def get_users():
    return repository.get_users()


def get_user_profile(user_id: str):
    user = repository.get_user_by_id(user_id)
    if user:
        # Hide password in response
        user.pop("password", None)
    return user


def update_user_profile(user_id: str, update_data: dict):
    user = repository.update_user_by_id(user_id, update_data)
    if user:
        user.pop("password", None)
    return user


def update_user_settings(user_id: str, settings_data: dict):
    return repository.update_user_settings(user_id, settings_data)