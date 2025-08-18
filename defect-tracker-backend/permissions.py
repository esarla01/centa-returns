from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt
from flask import jsonify
from flask import Blueprint, g
from seed_roles_permissions import ROLE_PERMISSIONS
from models import Permission, RolePermission, UserRole

def permission_required(permission):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            role = claims.get("role")
            if not role:
                return jsonify({"msg": "Role missing"}), 403
            user = g.user
            # Get the role id from the user
            print(f"User: {user}")
            role_id = user.role_id
            print(f"Role id: {role_id}")
            # Get the permission ids for the role
            permission_ids = [
                pid for (pid,) in
                RolePermission.query
                    .filter_by(role_id=role_id)
                    .with_entities(RolePermission.permission_id)
                    .all()
            ]
            print(f"Permission ids: {permission_ids}")
            # Get the permissions for the role
            permissions = (
                Permission.query
                .filter(Permission.id.in_(permission_ids))
                .all()
            )
            # Get permission enums from database
            permission_enums = [perm.name for perm in permissions]
            print(f"Permission enums: {permission_enums}")
            # Check if the user has the permission
            is_allowed = any(perm.name == permission for perm in permissions)
            print(f"Is allowed: {is_allowed}")
            # Debugging
            print(f"Allowed: {is_allowed}")
            print(f"Permission: {permission}")
            print(f"Role: {role}")
            # If the user does not have the permission, return a 403 error
            if not is_allowed:
                return jsonify({"msg": "Permission denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
