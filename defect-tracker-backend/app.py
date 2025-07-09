# app.py
import datetime
from flask import Flask, request, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token
from extensions import db, bcrypt
import models    # registers your User model with db
from dotenv import load_dotenv
import os
from flask_cors import CORS
from flask_mail import Mail, Message  # optional: install flask-mail
import secrets
from services.permissions import get_action_permission, get_all_permissions, get_allowed_fields

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY']                 = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=2)
    # TO DO: The token will expire in 2 hours.After that, any protected 
    # route requiring JWT will return a 401 Unauthorized, and the frontend 
    # can redirect to login.

    #sending email setup
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

   
    # initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)
    jwt = JWTManager(app)
    mail = Mail(app)

    CORS(app, origins=["http://localhost:3001"])

    # Add custom error handlers
    @jwt.unauthorized_loader
    def custom_unauthorized_response(err_str):
        return jsonify(msg="Token missing or invalid"), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify(msg="Session expired. Please log in again."), 401

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data     = request.get_json() or {}
        email    = data.get('email', '').strip()
        password = data.get('password', '')
        if not email or not password:
            return jsonify(msg="Email and password are required"), 400

        user = models.User.query.get(email)
        if not user or not user.check_password(password):
            return jsonify(
              msg="The password or email is incorrect! Please try again."
            ), 401

        user.last_login = datetime.datetime.utcnow()
        db.session.commit()

        token = create_access_token(
          identity=user.email,
          additional_claims={"role": user.role.value}
        )

        permissions = get_all_permissions(user.email)  

        return jsonify({
            'user': user.to_dict(),
            'permissions': permissions,
            'token': token
        }), 200
    
       

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json() or {}
        email      = data.get('email',     '').strip()
        password   = data.get('password',  '')
        first_name = data.get('first_name','').strip()
        last_name  = data.get('last_name', '').strip()

        if not email or not password or not first_name or not last_name:
            return jsonify(msg="All fields (email, password, first_name, last_name) are required"), 400

        if models.User.query.get(email):
            return jsonify(msg="A user with that email already exists"), 400

        user = models.User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=models.UserRole.user  # default role
        )
        user.set_password(password)

        user.created_at = datetime.datetime.utcnow()

        db.session.add(user)
        db.session.commit()

        return jsonify(msg="User registered"), 201
    
    @app.route('/api/auth/forgot-password', methods=['POST'])
    def forgot_password():
        data = request.get_json() or {}
        email = data.get('email', '').strip()

        user = models.User.query.get(email)
        print(f"User found: {user}")  # Debugging line to check user retrieval
        if not user:
            print(f"Hey there!")  # Debugging line to check user retrieval
            return jsonify(msg="Böyle bir kullanıcı mevcut değil!"), 400  

        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        db.session.commit()

        reset_url = f"http://localhost:3000/reset-password?token={token}"

        msg = Message(
            subject="Şifrenizi Sıfırlayın",
            recipients=[user.email],
            body=f"""Merhaba {user.first_name},

            Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki 
            bağlantıya tıklayarak yeni bir şifre seçebilirsiniz: 
            {reset_url} bu talebi siz yapmadıysanız, bu mesajı 
            dikkate almayın. Bu bağlantı 15 dakika boyunca geçerlidir.

            – Centa
            """,
                )
        mail.send(msg)

        return jsonify(msg="Eğer bu e-posta adresi mevcutsa, bir sıfırlama bağlantısı gönderilmiştir."), 200

    @app.route('/api/auth/reset-password', methods=['POST'])
    def reset_password():
        data = request.get_json() or {}
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')

        if not token or not new_password:
            return jsonify(msg="Token and new password are required"), 400

        user = models.User.query.filter_by(reset_token=token).first()

        if not user:
            return jsonify(msg="Invalid token"), 400

        if user.reset_token_expiry < datetime.datetime.utcnow():
            return jsonify(msg="Expired token"), 400

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()

        msg = Message(
        subject="Şifrenizi Sıfırlayın",
        recipients=[user.email],
        body=f"""Merhaba {user.first_name},

        Şifrenizi başarıyla sıfırladınız. Artık yeni şifrenizle 
        giriş yapabilirsiniz. Eğer bu talebi siz yapmadıysanız, 
        kimsenin bilmediğinden emin olduğunuz yeni bir şifre seçin 
        lütfen şifrenizi tekrar sıfırlayın.
        """,
            )
        mail.send(msg)

        return jsonify(msg="Password reset successfully"), 200
    
    @app.route('/api/auth/set-user-permissions', methods=['POST'])
    def set_user_permissions():
        data = request.get_json()

        # Extract and validate input
        user_email = data.get('user_email', '').strip()
        action = data.get('action', '').strip()
        field_name = data.get('field_name', '').strip()

        if not user_email or not action or not field_name:
            return jsonify(msg="User email, action, and field name are required"), 400

        # Validate action and field_name against enums
        if action not in models.UserActionPermission.__members__:
            return jsonify(msg=f"Invalid action: {action}"), 400
        if field_name not in models.UserFieldPermission.__members__:
            return jsonify(msg=f"Invalid field name: {field_name}"), 400

        # Check if user exists
        user = models.User.query.filter_by(email=user_email).first()
        if not user:
            return jsonify(msg="User does not exist"), 404

        # Create or update user permission
        permission = models.UserPermission.query.filter_by(user_email=user_email, action=action, field_name=field_name).first()
        if permission:
            return jsonify(msg="Permission already exists"), 400

        new_permission = models.UserPermission(
            user_email=user_email,
            action=models.UserActionPermission[action],
            field_name=models.UserFieldPermission[field_name]
        )
        db.session.add(new_permission)
        db.session.commit()

        return jsonify(msg="User permission set successfully"), 201

    @app.route('/api/auth/retrieve-user-permissions', methods=['GET'])
    def retrieve_user_permissions():
        user_email = request.args.get('user_email', '').strip()
        print(f"Retrieving permissions for user: {user_email}")  
        if not user_email:
            return jsonify(msg="User email is required"), 400

        user = models.User.query.get(user_email)
        if not user:
            return jsonify(msg="User not found"), 404

        permissions = get_all_permissions(user_email)

        return permissions, 200         
    
    
    @app.route('/api/add-case', methods=['POST'])
    def add_case():
        data = request.get_json() or {}
        required_fields = ['arrival_date', 'name', 'shipping_company']
        for field in required_fields:
            if not data.get(field, '').strip():
                return jsonify(msg=f"{field.replace('_', ' ').title()} is required"), 400

        # Validate statuses
        valid_statuses = {
            'warranty_status_overload': ['valid', 'expired', 'unknown', ''],
            'warranty_status_photosensor': ['valid', 'expired', 'unknown', ''],
            'payment_details': ['paid', 'unpaid', 'pending', ''],
            'status': ['open', 'in_progress', 'closed']
        }
        for field, valid in valid_statuses.items():
            if data.get(field) not in valid:
                return jsonify(msg=f"Invalid {field.replace('_', ' ')}"), 400

        new_case = models.Case(
            arrival_date=datetime.datetime.strptime(data['arrival_date'], '%Y-%m-%d'),
            name=data['name'].strip(),
            representative=data.get('representative', '').strip(),
            contact=data.get('contact', '').strip(),
            address=data.get('address', '').strip(),
            note=data.get('note', '').strip(),
            warranty_status_photosensor=data.get('warranty_status_photosensor') or None,
            photosensor_height_count=data.get('photosensor_height_count', 0),
            photosensor_power_count=data.get('photosensor_power_count', 0),
            warranty_status_overload=data.get('warranty_status_overload') or None,
            overload_lc1_count=data.get('overload_lc1_count', 0),
            performed_service=data.get('performed_service', '').strip(),
            cost=data.get('cost', 0.0),
            payment_details=data.get('payment_details') or models.PaymentStatus.pending.value,
            status=data.get('status') or models.CaseStatus.open.value,
            shipping_company=data['shipping_company'].strip(),
            shipping_date=datetime.datetime.strptime(data['shipping_date'], '%Y-%m-%d') if data.get('shipping_date') else None,
            shipping_addresses=data.get('shipping_addresses', '').strip(),
            shipping_information=data.get('shipping_information', '').strip()
        )
        db.session.add(new_case)
        db.session.commit()

        return jsonify(msg="Sample case added"), 200
        
    @app.route('/api/update-case', methods=['PATCH'])
    def update_case():
        data = request.get_json() or {}
        case_id = data.get('id')

        if not case_id:
            return jsonify(msg="Case ID is required"), 400

        case = models.Case.query.get(case_id)
        if not case:
            return jsonify(msg="Case not found"), 404
        
        # Validate statuses
        valid_statuses = {
            'warranty_status_overload': ['valid', 'expired', 'unknown', ''],
            'warranty_status_photosensor': ['valid', 'expired', 'unknown', ''],
            'payment_details': ['paid', 'unpaid', 'pending', ''],
            'status': ['open', 'in_progress', 'closed']
        }
        for field, valid in valid_statuses.items():
            if data.get(field) not in valid:
                return jsonify(msg=f"Invalid {field.replace('_', ' ')}"), 400

        allowed_fields = {
            'arrival_date', 'name', 'representative', 'contact', 'address', 'note',
            'warranty_status_photosensor', 'photosensor_height_count', 'photosensor_power_count',
            'warranty_status_overload', 'overload_lc1_count', 'performed_service', 
            'cost', 'payment_details', 'status', 'shipping_company', 
            'shipping_date', 'shipping_addresses', 'shipping_information'
        }

        invalid_fields = set(data) - allowed_fields - {'id'} - {'created_at'} - {'updated_at'}
        if invalid_fields:
            return jsonify(msg=f"Invalid fields: {', '.join(invalid_fields)}"), 400

        for field in allowed_fields & data.keys():
            setattr(case, field, data[field])

        db.session.commit()
        return jsonify(msg="Case updated successfully"), 200

    
    @app.route('/api/retrieve-cases', methods=['GET'])
    def retrieve_cases():
        filters = request.args.to_dict()  # Use request.args for GET parameters
        
        query = models.Case.query

        if 'status' in filters and filters['status'].strip():
            query = query.filter(models.Case.status == filters['status'])
        
        if 'dateTo' in filters and filters['dateTo'].strip():
            arrival_date = datetime.datetime.strptime(filters['dateTo'], '%Y-%m-%d')
            query = query.filter(models.Case.arrival_date <= arrival_date)
        
        if 'dateFrom' in filters and filters['dateFrom'].strip():
            arrival_date = datetime.datetime.strptime(filters['dateFrom'], '%Y-%m-%d')
            query = query.filter(models.Case.arrival_date >= arrival_date)

        if 'name' in filters and filters['name'].strip():
            query = query.filter(models.Case.name.ilike(f"%{filters['name']}%"))

        cases = query.all()
        cases.sort(key=lambda x: x.arrival_date, reverse=True)  # Sort by arrival_date descending
        case_list = [case.to_dict() for case in cases]  

        return jsonify(cases=case_list), 200
    

    @app.route('/api/admin/delete-user', methods=['POST'])
    def delete_user():
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        if not email:
            return jsonify(msg="Email is required"), 400

        user = models.User.query.get(email)
        if not user:
            return jsonify(msg="User not found"), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify(msg="User deleted"), 200
    
       
    @app.route('/api/admin/delete-all', methods=['POST'])
    def delete_all():
        # This endpoint is for development purposes only
        # It deletes all users in the database
        models.User.query.delete()
        db.session.commit()
        return jsonify(msg="All users deleted"), 200
    

    return app


if __name__ == '__main__':
    create_app().run(debug=True)

