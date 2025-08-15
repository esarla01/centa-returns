# seed_roles_permissions.py
from models import Customers, ProductModel, User, db, UserRole, AppPermissions, Role, Permission, RolePermission

ROLE_PERMISSIONS = {
    UserRole.ADMIN: [ 
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

        # CasesTable Permissions
        AppPermissions.CASE_EDIT,
        AppPermissions.CASE_COMPLETE_COMPLETED,
    ],
    UserRole.SUPPORT: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_CREATE,
        AppPermissions.CASE_EDIT,
        AppPermissions.CUSTOMER_GET,

        AppPermissions.CASE_EDIT_DELIVERED,
        AppPermissions.CASE_COMPLETE_DELIVERED,
    ],
    UserRole.TECHNICIAN: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT,
        AppPermissions.CASE_EDIT_TECHNICAL_REVIEW,
        AppPermissions.CASE_COMPLETE_TECHNICAL_REVIEW,
    ],
    UserRole.SALES: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CUSTOMER_LIST,
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # Customer Page Specific Permissions
        AppPermissions.CUSTOMER_CREATE,
        AppPermissions.CUSTOMER_EDIT,
        AppPermissions.CUSTOMER_DELETE,
        AppPermissions.CUSTOMER_UPDATE,
        AppPermissions.CUSTOMER_GET,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT,

   
    ],
    UserRole.LOGISTICS: [
        # Page Permissions
        AppPermissions.PAGE_VIEW_CASE_TRACKING,

        # CasesTable Permissions
        AppPermissions.CASE_EDIT_SHIPPING,
        AppPermissions.CASE_COMPLETE_SHIPPING,

        # # Customer Page Specific Permissions
        # AppPermissions.CUSTOMER_GET,

        # # CasesTable Permissions
        # AppPermissions.CASE_EDIT,
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

def seed_customers():
    customers_to_seed = [
        {
            'name': 'Hasan Asansör',
            'representative': 'Hasan Asansör',
            'contact_info': 'hasan@hasanasansor.com',
            'address': 'İstanbul'
        },
        {
            'name': 'Kılıç Asansör',
            'representative': 'Kılıç Asansör',
            'contact_info': 'kilic@kilicasansor.com',
            'address': 'Ankara'
        },
        {
            'name': 'Derya Asansör',
            'representative': 'Derya Asansör',
            'contact_info': 'derya@deryasansor.com',
            'address': 'İzmir'
        },
    ]
    for c in customers_to_seed:
        customer = Customers.query.filter_by(name=c['name']).first()
        if not customer:
            customer = Customers(**c)
            db.session.add(customer)
    db.session.commit()

def seed_products():
    from models import ProductTypeEnum, ProductModel
    products_to_seed = [
        {'name': 'DT42', 'product_type': ProductTypeEnum.door_detector},
        {'name': 'DT45', 'product_type': ProductTypeEnum.door_detector},
        {'name': 'L1', 'product_type': ProductTypeEnum.control_unit},
        {'name': 'Redstar', 'product_type': ProductTypeEnum.overload},
        {'name': 'Bluestar', 'product_type': ProductTypeEnum.overload},
    ]
    for p in products_to_seed:
        product = ProductModel.query.filter_by(name=p['name']).first()
        if not product:
            product = ProductModel(**p)
            db.session.add(product)
    db.session.commit()


def seed_all():
    seed_roles_permissions()
    seed_users()
    seed_customers()
    seed_products()

