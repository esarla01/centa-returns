import logging
import os

from flask import Flask, g, jsonify, request, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import (
    JWTManager,
    verify_jwt_in_request,
    get_jwt_identity
)
from sqlalchemy.orm import joinedload
from werkzeug.exceptions import HTTPException

from config import Config
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
from seed import seed_roles_permissions, seed_services, seed_users

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    logging.basicConfig(
        level=Config.LOG_LEVEL,
        format='%(asctime)s %(levelname)s %(name)s: %(message)s',
    )

    # Init extensions
    db.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    mail.init_app(app)

    CORS(app,
        supports_credentials=True,
        resources={r"/*": {"origins": Config.CORS_ORIGINS}},
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
        expose_headers=['Set-Cookie'],
    )

    @app.route("/")
    def index():
        return "Hello from Flask with Gunicorn!"

    @app.route("/health")
    def health():
        return {"status": "ok"}, 200

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
        """Attach the logged-in user (or None) to the request."""
        g.user = None
        if request.method == 'OPTIONS':
            return  # CORS preflight: no cookie, nothing to load
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            g.user = db.session.get(User, user_id, options=[joinedload(User.role)])
        except Exception:
            g.user = None

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Last line of defence: log the failure and answer with JSON."""
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description}), error.code
        db.session.rollback()
        logger.exception("Unhandled error on %s %s", request.method, request.path)
        return jsonify({"error": "Beklenmeyen bir hata oluştu."}), 500

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

# Seed roles, permissions and fault types the first time the app starts on an
# empty database.
with app.app_context():
    try:
        from models import Role
        if not Role.query.first():  # only seed if no roles exist
            seed_roles_permissions()
            seed_users()
            seed_services()
            logger.info("Database seeded successfully")
        else:
            logger.info("Database already seeded, skipping")
    except Exception as e:
        logger.warning("Seeding skipped (normal before the tables exist): %s", e)

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=int(os.getenv('PORT', 5000)), debug=debug_mode)
