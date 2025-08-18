from mailbox import Message
import os
import datetime

from flask_migrate import Migrate

from flask import Flask, g
from flask_cors import CORS
# from flask_migrate import Migrate

from dotenv import load_dotenv  # Load environment variables from .env file

from flask_jwt_extended import (
    JWTManager,
    verify_jwt_in_request,
    get_jwt_identity
)

from models import User, db, bcrypt, mail  # SQLAlchemy and Bcrypt instances

# Blueprints
from endpoints.user import user_bp  # User-related endpoints
from endpoints.customers import customer_bp  # Customer-related endpoints
from endpoints.products import product_bp  # Product-related endpoints
from endpoints.returns import return_case_bp  # Return case-related endpoints
from endpoints.admin import admin_bp  # Admin-related endpoints
from endpoints.reports import reports_bp  # Reports-related endpoints

from sqlalchemy.orm import joinedload # Load user with role

from seed_roles_permissions import seed_roles_permissions
from seed import seed_users

load_dotenv()

def create_app():
    app = Flask(__name__)
    
   # SQLAlchemy Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Session Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  
    jwt_exp_hours = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 1))  
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=jwt_exp_hours)  

    # Configure JWT to use cookies
    jwt_token_location = os.getenv('JWT_TOKEN_LOCATION', 'cookies')
    app.config['JWT_TOKEN_LOCATION'] = [jwt_token_location] 
    app.config['JWT_ACCESS_COOKIE_NAME'] = os.getenv('JWT_ACCESS_COOKIE_NAME', 'access_token')
   # Convert string to boolean properly
    app.config['JWT_COOKIE_SECURE'] = os.getenv('JWT_COOKIE_SECURE', 'False').lower() == 'true'
    app.config['JWT_COOKIE_CSRF_PROTECT'] = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'False').lower() == 'true'
    app.config['JWT_COOKIE_SAMESITE'] = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')


    # Email Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '465'))
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'True').lower() == 'true'
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'

    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db) 
    JWTManager(app)  
    mail.init_app(app)        

    # Get frontend URL from environment
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    CORS(app, 
        supports_credentials=True, 
        resources={r"/*": {"origins": [frontend_url]}},
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowed_headers=['Content-Type', 'Authorization'])


    @app.route("/")
    def index():
        return "Hello from Flask with Gunicorn!"

    @app.before_request
    def load_user():
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = db.session.get(User, user_id, options=[joinedload(User.role)])  
            if user:
                g.user = user
        except Exception:
            g.user = None
    
   # Create all tables
    with app.app_context():
        # # db.drop_all()
        # # db.create_all()
        # # seed_all()
        # pass
        # seed_users()
        # seed_roles_permissions()
        pass  # Add pass statement to fix indentation

    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(product_bp)  
    app.register_blueprint(return_case_bp)  
    app.register_blueprint(admin_bp)
    app.register_blueprint(reports_bp)

    return app

app = create_app()

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=int(os.getenv('PORT', 5000)), debug=debug_mode)


