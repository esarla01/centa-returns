from functools import wraps

from flask import g, jsonify
from flask_jwt_extended import get_jwt, jwt_required

from models import Permission, RolePermission


def get_user_permissions(user):
    """The set of AppPermissions the user's role grants. Looked up once per
    request and remembered on the user object."""
    cached = getattr(user, '_permissions', None)
    if cached is None:
        rows = (
            Permission.query
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .filter(RolePermission.role_id == user.role_id)
            .all()
        )
        cached = user._permissions = {row.name for row in rows}
    return cached


def permission_required(permission):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            if not get_jwt().get("role"):
                return jsonify({"msg": "Role missing"}), 403
            user = getattr(g, 'user', None)
            if user is None:
                return jsonify({"msg": "Kullanıcı bulunamadı"}), 401
            if permission not in get_user_permissions(user):
                return jsonify({"msg": "Permission denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
