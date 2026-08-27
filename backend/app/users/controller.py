from app.users import service


def get_users():
    return service.get_users()


def get_user_profile(user_id: str):
    return service.get_user_profile(user_id)


def update_user_profile(user_id: str, update_data: dict):
    return service.update_user_profile(user_id, update_data)


def update_user_settings(user_id: str, settings_data: dict):
    return service.update_user_settings(user_id, settings_data)