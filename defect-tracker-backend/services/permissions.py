from models import UserPermission, UserActionPermission, UserFieldPermission

def get_action_permission(user_email, action):
    try:
        action_enum = UserActionPermission[action]
        print(f"Action enum for {action}: {action_enum}")
    except KeyError:
        raise ValueError(f"Invalid action: {action}. Valid actions are: {list(UserActionPermission.__members__.keys())}")

    permission_count = UserPermission.query.filter_by(user_email=user_email, action=action_enum).count()
    
    return permission_count > 0
 

def get_allowed_fields(user_email, action):
    try:
        action_enum = UserActionPermission[action]
        print(f"Action enum for {action}: {action_enum}")
    except KeyError:
        raise ValueError(f"Invalid action: {action}. Valid actions are: {list(UserActionPermission.__members__.keys())}")

    allowed_fields = UserPermission.query.filter_by(user_email=user_email, action=action_enum).all()
    
    return [permission.field_name.value if isinstance(permission.field_name, UserFieldPermission) else permission.field_name for permission in allowed_fields]

def get_all_permissions(user_email):
    return {
        "can_create": get_action_permission(user_email, 'CREATE'),
        "can_edit": get_action_permission(user_email, 'EDIT'),
        "create_permissions": get_allowed_fields(user_email, 'CREATE'),
        "edit_permissions": get_allowed_fields(user_email, 'EDIT')
    }
