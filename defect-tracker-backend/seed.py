
from models import User, Role, UserRole, db

def seed_users():
    # Create users
    users_to_seed = [
        {
            'email': "kargo@centa.com",
            'password': "Kargo123!",
            'first_name': "Kargo",
            'last_name': "Personeli",
            'role_enum': UserRole.LOGISTICS
        },
        {
            'email': "satis@centa.com",
            'password': "Satis123!",
            'first_name': "Satış",
            'last_name': "Personeli",
            'role_enum': UserRole.SALES
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
