# seed_roles_permissions.py
from models import  User, db, UserRole, AppPermissions, Role, Permission, RolePermission
from datetime import datetime

ROLE_PERMISSIONS = {
    UserRole.ADMIN: [ 
        # Page Permissions
        AppPermissions.PAGE_VIEW_ADMIN,
        AppPermissions.PAGE_VIEW_CUSTOMER_LIST,
        AppPermissions.PAGE_VIEW_PRODUCT_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        AppPermissions.PAGE_VIEW_STATISTICS,
    ],
    UserRole.MANAGER: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_PRODUCT_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        AppPermissions.PAGE_VIEW_STATISTICS,
    ],
    UserRole.SUPPORT: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_CREATE,
        AppPermissions.CASE_EDIT_DELIVERED,
        AppPermissions.CASE_COMPLETE_DELIVERED,
    ],
    UserRole.TECHNICIAN: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT_TECHNICAL_REVIEW,
        AppPermissions.CASE_COMPLETE_TECHNICAL_REVIEW,
    ],
    UserRole.SALES: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CUSTOMER_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT_PAYMENT_COLLECTION,
        AppPermissions.CASE_COMPLETE_PAYMENT_COLLECTION,
    ],
    UserRole.LOGISTICS: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT_SHIPPING,
        AppPermissions.CASE_COMPLETE_SHIPPING,
    ],
}

def seed_roles_permissions():
    # Create roles
    for role_enum in UserRole:
        role = Role.query.filter_by(name=role_enum).first()
        if not role:
            role = Role(name=role_enum)
            db.session.add(role)
    db.session.commit()

    # Create permissions
    for perm_enum in AppPermissions:
        perm = Permission.query.filter_by(name=perm_enum).first()
        if not perm:
            perm = Permission(name=perm_enum)
            db.session.add(perm)
    db.session.commit()

    # Assign permissions to roles
    for role_enum, perms in ROLE_PERMISSIONS.items():
        role = Role.query.filter_by(name=role_enum).first()
        for perm_enum in perms:
            perm = Permission.query.filter_by(name=perm_enum).first()
            rp = RolePermission.query.filter_by(role_id=role.id, permission_id=perm.id).first()
            if not rp:
                db.session.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.session.commit()




def seed_users():
    # Create users
    users_to_seed = [
        {
            'email': "erinsarlak003@gmail.com",
            'password': "ErinSarlak123!",
            'first_name': "Erin",
            'last_name': "Sarlak",
            'role_enum': UserRole.ADMIN
        },
        {
            'email': "gulsarlak003@gmail.com",
            'password': "GulSarlak123!",
            'first_name': "Gül",
            'last_name': "Şarlak",
            'role_enum': UserRole.MANAGER
        },
        {
            'email': "tansusarlak@gmail.com",
            'password': "TansuSarlak123!",
            'first_name': "Tansu",
            'last_name': "Şarlak",
            'role_enum': UserRole.SUPPORT
        },
        {
            'email': "emirsarlak@gmail.com",
            'password': "EmirSarlak123!",
            'first_name': "Emir",
            'last_name': "Şarlak",
            'role_enum': UserRole.TECHNICIAN
        },
    ]

    for user_data in users_to_seed:
        user = User.query.filter_by(email=user_data['email']).first()
        role_obj = Role.query.filter_by(name=user_data['role_enum']).first()
        if not user and role_obj:
            user = User(
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=role_obj
            )
            user.set_password(user_data['password'])
            db.session.add(user)
    db.session.commit()

def seed_users():
    # Only one user as requested
    user_data = {
        'email': "erinsarlak003@gmail.com",
        'password': "ErinSarlak123!",
        'first_name': "Erin",
        'last_name': "Sarlak",
        'role_enum': UserRole.ADMIN,
        'accepted_at': datetime(2024, 6, 1, 10, 0, 0),
        'invited_at': datetime(2024, 5, 25, 15, 30, 0)
    }

    user = User.query.filter_by(email=user_data['email']).first()
    role_obj = Role.query.filter_by(name=user_data['role_enum']).first()
    if not user and role_obj:
        user = User(
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=role_obj
        )
        user.set_password(user_data['password'])
        # Set accepted_at and invited_at if those columns exist
        if hasattr(user, 'accepted_at'):
            user.accepted_at = user_data['accepted_at']
        if hasattr(user, 'invited_at'):
            user.invited_at = user_data['invited_at']
        db.session.add(user)
    db.session.commit()
    db.session.commit()
