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

    # CUSTOMER
    PAGE_VIEW_CUSTOMER_LIST = auto()
    CUSTOMER_CREATE = auto()
    CUSTOMER_EDIT = auto()
    CUSTOMER_DELETE = auto()
    CUSTOMER_UPDATE = auto()
    CUSTOMER_GET = auto()

    PAGE_VIEW_PRODUCT_LIST = auto()
    PAGE_VIEW_CASE_TRACKING = auto()
    PAGE_VIEW_STATISTICS = auto()


    CASE_CREATE = auto()
    CASE_EDIT = auto()
    CASE_DELETE = auto()
    CASE_GET = auto()

   
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
    last_logout = db.Column(db.DateTime(timezone=True))
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
    TECHNICAL_REVIEW = 'Teknik İnceleme'
    DOCUMENTATION = 'Dokümantasyon'
    SHIPPING = 'Kargoya Verildi'
    COMPLETED = 'Tamamlandı'

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

    # SUPPORT will fill out the customer_id, arrival_date, receipt_method
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    arrival_date = db.Column(db.Date, nullable=False, default=datetime.utcnow, index=True)
    receipt_method = db.Column(db.Enum(ReceiptMethodEnum), nullable=False, default=ReceiptMethodEnum.shipment)
    notes = db.Column(db.Text, nullable=True)

    # TECHNICIAN will fill out the items (product_type, product_model_id, product_count, serial_number, warranty_status, fault_source)
    items = db.relationship('ReturnCaseItem', back_populates='return_case', cascade='all, delete-orphan')

    # SUPPORT will fill out the performed services and cost
    performed_services = db.Column(db.Text, nullable=True)
    cost = db.Column(db.Numeric(10, 2), nullable=True)

    # LOGISTICS will fill out the shipping_info
    shipping_info = db.Column(db.String(255), nullable=True)

    # SALES will fill out the payment_status
    payment_status = db.Column(db.Enum(PaymentStatusEnum), nullable=True)

    # Current workflow status of the return case - automatically filled out by the system
    workflow_status = db.Column(db.Enum(CaseStatusEnum), nullable=False, default=CaseStatusEnum.TECHNICAL_REVIEW, index=True)
    assigned_user_id = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=True, index=True)

    # The following line creates a relationship attribute 'customer' on the ReturnCase model,
    # allowing access to the related Customers object for each return case.
    # It also adds a 'return_cases' attribute to the Customers model for accessing all related return cases.
    customer = db.relationship('Customers', backref=db.backref('return_cases', lazy=True))

    # Relationship to the assigned user
    assigned_user = db.relationship('User', foreign_keys=[assigned_user_id])

    # The following line creates a relationship attribute 'items' on the ReturnCase model,
    # allowing access to all related ReturnCaseItem objects for each return case.
    # The 'back_populates' argument links this relationship to the 'return_case' relationship on ReturnCaseItem.
    # The 'cascade' option ensures that when a ReturnCase is deleted, all its associated items are also deleted.
    items = db.relationship('ReturnCaseItem', back_populates='return_case', cascade='all, delete-orphan')


    def __repr__(self):
        return f'<ReturnCase id={self.id} customer_id={self.customer_id} status={self.workflow_status.value}>'

class ReturnCaseItem(db.Model):
    __tablename__ = 'return_case_items'

    id = db.Column(db.Integer, primary_key=True)
    return_case_id = db.Column(db.Integer, db.ForeignKey('return_cases.id'), nullable=False)

    # Information about the product
    product_model_id = db.Column(db.Integer, db.ForeignKey('product_models.id'), nullable=True)
    product_count = db.Column(db.Integer, nullable=False, default=1)
    serial_number = db.Column(db.String(100), nullable=True)

    # Warranty status of the product
    warranty_status = db.Column(db.Enum(WarrantyStatusEnum), nullable=False, default=WarrantyStatusEnum.unknown)

    # Fault source of the defect
    fault_source = db.Column(db.Enum(FaultSourceEnum), nullable=False, default=FaultSourceEnum.unknown)

    # Indicates whether this item is a main product (e.g., overload or door detector or an individual control unit) or an accessory (a control unit attached to a main product).
    is_main_product = db.Column(db.Boolean, default=True, nullable=False)
    attached_to_item_id = db.Column(db.Integer, db.ForeignKey('return_case_items.id'), nullable=True)

    
    # Relationship to the parent ReturnCase. This allows each ReturnCaseItem to access its associated ReturnCase object.
    # The 'back_populates' argument links this relationship to the 'items' relationship on the ReturnCase model,
    # enabling bidirectional access between ReturnCase and its items.
    return_case = db.relationship('ReturnCase', back_populates='items')

    # Relationship to the ProductModel. This allows each ReturnCaseItem to access its associated ProductModel object.
    # This is useful for retrieving detailed information about the specific product model for this item.
    product_model = db.relationship('ProductModel')

    # Self-referential relationship to represent accessories or sub-items attached to a main product.
    # 'accessories' provides access to all ReturnCaseItems that are attached to this item (i.e., its accessories).
    # The 'backref' creates a 'parent_item' attribute on each accessory, pointing back to its main product.
    # 'remote_side=[id]' is required for self-referential relationships to clarify which side is the parent.
    accessories = db.relationship(
        'ReturnCaseItem',
        backref=db.backref('parent_item', remote_side=[id])
    )

    def __repr__(self):
        return f'<ReturnCaseItem id={self.id} product_model_id={self.product_model_id} case_id={self.return_case_id}>'
