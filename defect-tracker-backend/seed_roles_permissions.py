# seed_roles_permissions.py
from models import User, db, UserRole, AppPermissions, Role, Permission, RolePermission

ROLE_PERMISSIONS = {
    UserRole.ADMIN: [ 
        AppPermissions.PAGE_VIEW_ADMIN,
        AppPermissions.PAGE_VIEW_CUSTOMER_LIST,
        AppPermissions.PAGE_VIEW_PRODUCT_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        AppPermissions.PAGE_VIEW_STATISTICS,
    ],
    UserRole.MANAGER: [
        AppPermissions.PAGE_VIEW_PRODUCT_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        AppPermissions.PAGE_VIEW_STATISTICS,
    ],
    UserRole.SUPPORT: [
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        # AppPermissions.CASE_CREATE,
        # AppPermissions.CASE_EDIT_INITIAL_INFO,
        # AppPermissions.CASE_TRANSITION_TO_TECHNICAL_REVIEW_REPAIR,
    ],
    UserRole.TECHNICIAN: [
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        # AppPermissions.CASE_EDIT_TECHNICAL_REVIEW,
        # AppPermissions.CASE_TRANSITION_TO_DOCUMENTATION_COST_ENTRY,
    ],
    UserRole.SALES: [
        AppPermissions.PAGE_VIEW_CUSTOMER_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        # AppPermissions.CASE_EDIT_COST,
        # AppPermissions.CASE_TRANSITION_TO_COST_REIMBURSEMENT_SHIPPING,
    ],
    UserRole.LOGISTICS: [
        AppPermissions.PAGE_VIEW_CASE_TRACKING,
        # AppPermissions.CASE_EDIT_SHIPPING,
        # AppPermissions.CASE_TRANSITION_TO_COMPLETED,
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
    # Erin Sarlak
    email = "erinsarlak003@gmail.com"
    password = "ErinSarlak123!"
    first_name = "Erin"
    last_name = "Sarlak"
    role = UserRole.ADMIN

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=first_name, last_name=last_name, role=role)
        user.set_password(password)
        db.session.add(user)

    # Gül Şarlak
    email = "gulsarlak003@gmail.com"
    password = "GulSarlak123!"
    first_name = "Gül"
    last_name = "Şarlak"
    role = UserRole.MANAGER

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=first_name, last_name=last_name, role=role)
        user.set_password(password)
        db.session.add(user)
    
    # Tansu Şarlak
    email = "tansusarlak@gmail.com"
    password = "TansuSarlak123!"
    first_name = "Tansu"
    last_name = "Şarlak"
    role = UserRole.SUPPORT

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=first_name, last_name=last_name, role=role)
        user.set_password(password)
        db.session.add(user)
    
    # Emir Şarlak
    email = "emirsarlak@gmail.com"
    password = "EmirSarlak123!"
    first_name = "Emir"
    last_name = "Şarlak"
    role = UserRole.TECHNICIAN

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, first_name=first_name, last_name=last_name, role=role)
        user.set_password(password)
        db.session.add(user)

    db.session.commit()


def seed_all():
    seed_roles_permissions()
    seed_users()

