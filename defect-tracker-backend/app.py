import os
import datetime

from flask import Flask, g, request, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv  
from flask_jwt_extended import (
    JWTManager,
    verify_jwt_in_request,
    get_jwt_identity
)
from sqlalchemy.orm import joinedload  

from models import User, db, bcrypt, mail  

# Blueprints
from endpoints.user import user_bp  
from endpoints.customers import customer_bp  
from endpoints.products import product_bp  
from endpoints.services import service_bp
from endpoints.returns import return_case_bp  
from endpoints.admin import admin_bp  
from endpoints.reports import reports_bp  
from endpoints.user_action_logs import user_action_logs_bp

# Seed functions
from seed import seed_roles_permissions, seed_services
from seed import seed_users

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Database Config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # JWT Config
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  
    jwt_exp_hours = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 1))  
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=jwt_exp_hours)  
    app.config['JWT_TOKEN_LOCATION'] = [os.getenv('JWT_TOKEN_LOCATION', 'cookies')] 
    app.config['JWT_ACCESS_COOKIE_NAME'] = os.getenv('JWT_ACCESS_COOKIE_NAME', 'access_token')
    # app.config['JWT_COOKIE_SECURE'] = os.getenv('JWT_COOKIE_SECURE', 'False').lower() == 'true'
    # app.config['JWT_COOKIE_CSRF_PROTECT'] = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'False').lower() == 'true'
    # app.config['JWT_COOKIE_SAMESITE'] = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')
    # Update these JWT settings
    app.config['JWT_COOKIE_SECURE'] = os.getenv('JWT_COOKIE_SECURE', 'True').lower() == 'true'
    app.config['JWT_COOKIE_SAMESITE'] = os.getenv('JWT_COOKIE_SAMESITE', 'None')  # None for cross-origin
    app.config['JWT_COOKIE_CSRF_PROTECT'] = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'False').lower() == 'true'
    app.config['JWT_COOKIE_DOMAIN'] = os.getenv('JWT_COOKIE_DOMAIN', None)

    # Email Config
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '465'))
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'True').lower() == 'true'
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'

    # Init extensions
    db.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db) 
    JWTManager(app)  
    mail.init_app(app)        

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    allowed_origins = [
        frontend_url,
        'https://centa-returns-frontend-production.up.railway.app',
        'https://ariza.centa.com.tr',
    ]
    CORS(app,
        supports_credentials=True,
        resources={r"/*": {"origins": allowed_origins}},
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowed_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
        expose_headers=['Set-Cookie'],
        allow_credentials=True
    )

    @app.route("/")
    def index():
        return "Hello from Flask with Gunicorn!"

    @app.before_request
    def force_https():
        """Force HTTPS redirects in production"""
        if os.getenv('RAILWAY_ENVIRONMENT'):
            # For Railway, always ensure HTTPS
            if request.headers.get('X-Forwarded-Proto') == 'http':
                url = request.url.replace('http://', 'https://', 1)
                return redirect(url, code=301)
    
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
    
    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(product_bp)  
    app.register_blueprint(service_bp)
    app.register_blueprint(return_case_bp)  
    app.register_blueprint(admin_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(user_action_logs_bp)
    
    app.url_map.strict_slashes = False


    return app

app = create_app()

# Auto-seed on startup (optional - remove if you prefer manual seeding)
with app.app_context():
    try:
        seed_roles_permissions()
        seed_users()
        seed_services()
        print("✅ Database seeded successfully")
    except Exception as e:
        print(f"⚠️  Seeding failed (this is normal if data already exists): {e}")

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=int(os.getenv('PORT', 5000)), debug=debug_mode)


