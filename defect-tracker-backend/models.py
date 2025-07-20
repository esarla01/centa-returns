from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_bcrypt import Bcrypt 
from datetime import datetime
from enum import Enum, auto

db = SQLAlchemy()
mail = Mail()
bcrypt = Bcrypt()

class UserRole(Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TECHNICIAN = "TECHNICIAN"
    SUPPORT = "SUPPORT"
    SALES = "SALES"
    LOGISTICS = "LOGISTICS"

class AppPermissions(Enum):
    PAGE_VIEW_ADMIN = auto()
    PAGE_VIEW_CUSTOMER_LIST = auto()
    PAGE_VIEW_PRODUCT_LIST = auto()
    PAGE_VIEW_CASE_TRACKING = auto()
    PAGE_VIEW_STATISTICS = auto()
    # CASE_CREATE = auto()
    # CASE_EDIT_INITIAL_INFO = auto()
    # CASE_TRANSITION_TO_TECHNICAL_REVIEW_REPAIR = auto()
    # CASE_EDIT_TECHNICAL_REVIEW = auto()
    # CASE_EDIT_REPAIR_DETAILS = auto()
    # CASE_TRANSITION_TO_DOCUMENTATION_COST_ENTRY = auto()
    # CASE_EDIT_COST = auto()
    # CASE_TRANSITION_TO_COST_REIMBURSEMENT_SHIPPING = auto()
    # CASE_TRANSITION_TO_COMPLETED = auto()
    # CASE_EDIT_SHIPPING = auto()

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Enum(UserRole), unique=True, nullable=False)

class Permission(db.Model):
    __tablename__ = 'permissions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Enum(AppPermissions), unique=True, nullable=False)

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id'), nullable=False)

class User(db.Model):
    __tablename__ = 'users'
    # User credentials
    email = db.Column(db.String(254), primary_key=True)
    password_hash = db.Column(db.String(100), nullable=False)

    # Role information
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)    
    role = db.relationship('Role')

    # Personal information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)

    # Login information
    last_login = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Password reset information
    reset_token = db.Column(db.String(128), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)


class Customers(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    representative = db.Column(db.String(100), nullable=True)
    contact_info = db.Column(db.String(200), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProductTypeEnum(Enum):
    overload = 'Aşırı Yük Sensörü'
    door_detector = 'Kapı Dedektörü'
    control_unit = 'Kontrol Ünitesi'

class ProductModel(db.Model):
    __tablename__ = 'product_models'
    id = db.Column(db.Integer, primary_key=True)
    product_type = db.Column(db.Enum(ProductTypeEnum), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class CaseStatusEnum(Enum):
    open = 'Açık'
    in_progress = 'Devam Ediyor'
    awaiting_parts = 'Parça Bekleniyor'
    repaired = 'Tamir Edildi'
    shipped = 'Gönderildi'
    closed = 'Kapalı'

class ReceiptMethodEnum(Enum):
    shipment = 'Kargo'
    in_person = 'Elden Teslim'

class WarrantyStatusEnum(Enum):
    in_warranty = 'Garanti Dahilinde'
    out_of_warranty = 'Garanti Dışı'
    unknown = 'Bilinmiyor'

class PaymentStatusEnum(Enum):
    paid = 'Ödendi'
    unpaid = 'Ödenmedi'
    waived = 'Ücretsiz'

class FaultSourceEnum(Enum):
    our_firm = 'Firmamız'
    customer = 'Müşteri'
    unknown = 'Bilinmiyor'

class ReturnCase(db.Model):
    __tablename__ = 'return_cases'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Enum(CaseStatusEnum), nullable=False, default=CaseStatusEnum.open, index=True)
    arrival_date = db.Column(db.Date, nullable=False, default=datetime.utcnow, index=True)
    receipt_method = db.Column(db.Enum(ReceiptMethodEnum), nullable=False)
    fault_source = db.Column(db.Enum(FaultSourceEnum), nullable=False, default=FaultSourceEnum.unknown)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    assigned_user_id = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=True, index=True)
    warranty_status = db.Column(db.Enum(WarrantyStatusEnum), nullable=False, default=WarrantyStatusEnum.unknown)
    cost = db.Column(db.Numeric(10, 2), nullable=True)
    payment_status = db.Column(db.Enum(PaymentStatusEnum), nullable=True)
    shipping_info = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    customer = db.relationship('Customers', backref=db.backref('return_cases', lazy=True))
    assigned_user = db.relationship('User', backref=db.backref('assigned_cases', lazy=True))
    items = db.relationship('ReturnCaseItem', back_populates='return_case', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<ReturnCase id={self.id} customer_id={self.customer_id} status={self.status.value}>'

class ReturnCaseItem(db.Model):
    __tablename__ = 'return_case_items'

    id = db.Column(db.Integer, primary_key=True)
    return_case_id = db.Column(db.Integer, db.ForeignKey('return_cases.id'), nullable=False)
    product_type = db.Column(db.Enum(ProductTypeEnum), nullable=False)
    product_model_id = db.Column(db.Integer, db.ForeignKey('product_models.id'), nullable=True)
    product_count = db.Column(db.Integer, nullable=False, default=1)
    serial_number = db.Column(db.String(100), nullable=True)
    is_main_product = db.Column(db.Boolean, default=True, nullable=False)
    attached_to_item_id = db.Column(db.Integer, db.ForeignKey('return_case_items.id'), nullable=True)

    return_case = db.relationship('ReturnCase', back_populates='items')
    product_model = db.relationship('ProductModel')
    accessories = db.relationship('ReturnCaseItem', backref=db.backref('parent_item', remote_side=[id]))

    def __repr__(self):
        return f'<ReturnCaseItem id={self.id} product_model_id={self.product_model_id} case_id={self.return_case_id}>'
