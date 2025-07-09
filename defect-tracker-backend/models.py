# models.py
from datetime import datetime
import enum
from extensions import db, bcrypt
from enum import Enum

class UserRole(enum.Enum):
    admin   = 'admin'
    manager = 'manager'
    user    = 'user'

class User(db.Model):
    __tablename__ = 'users'

    email         = db.Column(db.String(254), primary_key=True)
    password_hash = db.Column(db.String(100), nullable=False)
    role          = db.Column(db.Enum(UserRole, name='user_role'),
                              nullable=False, default=UserRole.user)
    first_name    = db.Column(db.String(50), nullable=False)
    last_name     = db.Column(db.String(50), nullable=False)
    last_login    = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token = db.Column(db.String(128), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)
    
    def to_dict(self):
        return {
            "email": self.email,
            "role": self.role.value,
            "first_name": self.first_name,
            "last_name": self.last_name,
        }

class CaseStatus(enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    closed = "Closed"

class PaymentStatus(enum.Enum):
    paid = "Paid"
    unpaid = "Unpaid"
    pending = "Pending"

class WarrantyStatus(enum.Enum):
    valid = "Valid"
    expired = "Expired"
    unknown = "Unknown"

class UserActionPermission(enum.Enum):
    CREATE = "Create"
    EDIT = "Edit"

class UserFieldPermission(enum.Enum):  
    ARRIVAL_DATE = "Arrival Date"
    REPRESENTATIVE_NAME = "Representative Name"
    CONTACT_INFORMATION = "Contact Information"
    ADDRESS_DETAILS = "Address Details"
    NOTES = "Notes"
    WARRANTY_STATUS_PHOTOSENSOR = "Warranty Status for Photosensor"
    PHOTOSENSOR_HEIGHT_COUNT = "Photosensor Height Count"
    PHOTOSENSOR_POWER_COUNT = "Photosensor Power Count"
    WARRANTY_STATUS_OVERLOAD = "Warranty Status for Overload"
    OVERLOAD_LC1_COUNT = "Overload LC1 Count"
    PERFORMED_SERVICE_DESCRIPTION = "Performed Service Description"
    COST_AMOUNT = "Cost Amount"
    PAYMENT_DETAILS_STATUS = "Payment Details Status"
    CASE_STATUS = "Case Status"
    SHIPPING_COMPANY_NAME = "Shipping Company Name"
    SHIPPING_DATE_INFO = "Shipping Date Information"
    SHIPPING_ADDRESSES_DETAILS = "Shipping Addresses Details"
    SHIPPING_INFORMATION_DETAILS = "Shipping Information Details"

    
class Case(db.Model):
    __tablename__ = 'cases'

    id = db.Column(db.Integer, primary_key=True)

    # Mandatory fields
    arrival_date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(100), nullable=False)

    # Optional fields
    representative = db.Column(db.String(100), nullable=True)
    contact = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    note = db.Column(db.Text, nullable=True)

    # Optional enums & counts
    warranty_status_photosensor = db.Column(db.Enum(WarrantyStatus), nullable=True)
    photosensor_height_count = db.Column(db.Integer, default=0, nullable=False)
    photosensor_power_count = db.Column(db.Integer, default=0, nullable=False)

    warranty_status_overload = db.Column(db.Enum(WarrantyStatus), nullable=True)
    overload_lc1_count = db.Column(db.Integer, default=0, nullable=False)

    performed_service = db.Column(db.Text, nullable=True)
    cost = db.Column(db.Numeric(10, 2), default=0, nullable=False)

    # Optional payment & status enums
    payment_details = db.Column(db.Enum(PaymentStatus), nullable=True)
    status = db.Column(db.Enum(CaseStatus), nullable=True)

    # Optional shipping info
    shipping_company = db.Column(db.String(100), nullable=True)
    shipping_date = db.Column(db.Date, nullable=True)
    shipping_addresses = db.Column(db.Text, nullable=True)
    shipping_information = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "arrival_date": self.arrival_date.isoformat() if self.arrival_date else None,
            "name": self.name,
            "representative": self.representative,
            "contact": self.contact,
            "address": self.address,
            "note": self.note,

            "warranty_status_photosensor": self.warranty_status_photosensor.value if self.warranty_status_photosensor else None,
            "photosensor_height_count": self.photosensor_height_count,
            "photosensor_power_count": self.photosensor_power_count,

            "warranty_status_overload": self.warranty_status_overload.value if self.warranty_status_overload else None,
            "overload_lc1_count": self.overload_lc1_count,

            "performed_service": self.performed_service,
            "cost": float(self.cost) if self.cost is not None else None,

            "payment_details": self.payment_details.value if self.payment_details else None,
            "status": self.status.value if self.status else None,

            "shipping_company": self.shipping_company,
            "shipping_date": self.shipping_date.isoformat() if self.shipping_date else None,
            "shipping_addresses": self.shipping_addresses,
            "shipping_information": self.shipping_information,

            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
class UserPermission(db.Model):
    __tablename__ = 'user_permissions'
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=False)
    action = db.Column(db.Enum(UserActionPermission), nullable=False)  
    field_name = db.Column(db.Enum(UserFieldPermission), nullable=False)

# class Company(db.Model):
#     __tablename__ = 'companies'

#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), unique=True, nullable=False)
#     representative = db.Column(db.String(100))
#     contact = db.Column(db.String(100))
#     address = db.Column(db.Text)


# class ShippingCompany(db.Model):
#     __tablename__ = 'shipping_companies'

#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), unique=True, nullable=False)
