"""Application settings, read once from environment variables."""
import datetime
import os

from dotenv import load_dotenv

load_dotenv()


def _flag(name, default):
    return os.getenv(name, default).lower() == 'true'


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 1)))
    JWT_TOKEN_LOCATION = [os.getenv('JWT_TOKEN_LOCATION', 'cookies')]
    JWT_ACCESS_COOKIE_NAME = os.getenv('JWT_ACCESS_COOKIE_NAME', 'access_token')
    JWT_COOKIE_SECURE = _flag('JWT_COOKIE_SECURE', 'True')
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE', 'None')  # None for cross-origin
    JWT_COOKIE_CSRF_PROTECT = _flag('JWT_COOKIE_CSRF_PROTECT', 'False')
    JWT_COOKIE_DOMAIN = os.getenv('JWT_COOKIE_DOMAIN', None)

    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '465'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    MAIL_USE_SSL = _flag('MAIL_USE_SSL', 'True')
    MAIL_USE_TLS = _flag('MAIL_USE_TLS', 'False')

    # Browser origins allowed to call the API.
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    CORS_ORIGINS = [
        FRONTEND_URL,
        'https://centa-returns-frontend-production.up.railway.app',
        'https://ariza.centa.com.tr',
    ]

    # Base address used for links inside emails (invitations, password resets).
    EMAIL_LINK_BASE_URL = os.getenv(
        'EMAIL_LINK_BASE_URL', 'https://centa-returns-frontend-production.up.railway.app'
    ).rstrip('/')

    # Email the team that owns the next stage each time a stage is completed.
    STAGE_EMAILS_ENABLED = _flag('STAGE_EMAILS_ENABLED', 'False')

    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
