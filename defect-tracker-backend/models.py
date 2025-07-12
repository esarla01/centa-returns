from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_bcrypt import Bcrypt 
from datetime import datetime
from enum import Enum

db     = SQLAlchemy()
mail = Mail()
bcrypt = Bcrypt()

class UserRole(Enum):
    admin = 'admin'
    manager = 'manager'
    user = 'user' 

class User(db.Model):
    __tablename__ = 'users'

    email = db.Column(db.String(254), primary_key=True)
    password_hash = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum(UserRole, name='user_role'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    last_login = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token = db.Column(db.String(128), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)
    

class UserFieldPermission(Enum):
    ARRIVAL_DATE = "Arrival Date"
    CUSTOMER_NAME = "Customer Name"
    CONTACT_INFORMATION = "Contact Information"
    ADDRESS_DETAILS = "Address Details"
    CUSTOMER_TYPE = "Customer Type"

    PRODUCT_TYPE = "Product Type"
    PRODUCT_NAME = "Product Name"
    PRODUCT_COUNT = "Product Count"
    RECEIPT_METHOD = "Receipt Method"
    WARRANTY_STATUS = "Warranty Status"
    PERFORMED_SERVICE_DESCRIPTION = "Performed Service Description"
    COST_AMOUNT = "Cost Amount"
    CASE_STATUS = "Case Status"
    PAYMENT_DETAILS_STATUS = "Payment Details Status"
    SHIPPING_COMPANY_NAME = "Shipping Company Name"
    SHIPPING_DATE_INFO = "Shipping Date Information"
    SHIPPING_ADDRESSES_DETAILS = "Shipping Addresses Details"
    SHIPPING_INFORMATION_DETAILS = "Shipping Information Details"


class UserPermission(db.Model):
    __tablename__ = 'user_permissions'

    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=False)
    field_name = db.Column(db.Enum(UserFieldPermission), nullable=False)
    can_view = db.Column(db.Boolean, default=True, nullable=False)
    can_edit = db.Column(db.Boolean, default=False, nullable=False)
