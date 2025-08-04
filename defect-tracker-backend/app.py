import os
import datetime

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

from sqlalchemy.orm import joinedload # Load user with role

from seed_roles_permissions import seed_all

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # SQLAlchemy Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Session Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Ensure this is set in your environment
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=8)  # Token expiration time

    # Configure JWT to use cookies
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']  # Use cookies to store the token
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'  # Name of the access token cookie
    app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Enable CSRF protection in production
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # Or 'None' if needed

    
    # Email Configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

   
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    # Migrate(app, db)
    JWTManager(app)  
    mail.init_app(app)        

    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

    @app.before_request
    def load_user():
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.options(joinedload(User.role)).get(user_id)  
            if user:
                g.user = user
        except Exception:
            g.user = None
    
   # Create all tables
    # with app.app_context():
    #     db.drop_all()
    #     db.create_all()
    #     seed_all()


    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(product_bp)  
    app.register_blueprint(return_case_bp)  
    app.register_blueprint(admin_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host="localhost", port=5000, debug=True)


