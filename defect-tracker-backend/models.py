from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt 
from datetime import datetime, timezone
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

    # CUSTOMER
    PAGE_VIEW_CUSTOMER_LIST = auto()
    CUSTOMER_CREATE = auto()
    CUSTOMER_EDIT = auto()
    CUSTOMER_DELETE = auto()
    CUSTOMER_UPDATE = auto()
    CUSTOMER_GET = auto()

    # PAGES
    PAGE_VIEW_ADMIN = auto()
    PAGE_VIEW_PRODUCT_LIST = auto()
    PAGE_VIEW_CASE_TRACKING = auto()
    PAGE_VIEW_STATISTICS = auto()

    # CASES
    CASE_CREATE = auto()
    CASE_EDIT = auto()
    CASE_DELETE = auto()
    CASE_GET = auto()

    # CASE_EDIT_STAGES
    CASE_EDIT_DELIVERED = auto() # Support
    CASE_EDIT_TECHNICAL_REVIEW = auto() # Technician
    CASE_EDIT_PAYMENT_COLLECTION = auto() # Sales
    CASE_EDIT_SHIPPING = auto() # Logistics


    # CASE_COMPLETE_STAGES
    CASE_COMPLETE_DELIVERED = auto() # Support
    CASE_COMPLETE_TECHNICAL_REVIEW = auto() # Technician
    CASE_COMPLETE_PAYMENT_COLLECTION = auto() # Sales
    CASE_COMPLETE_SHIPPING = auto() # Logistics
    CASE_COMPLETE_COMPLETED = auto() # Manager

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
    password_hash = db.Column(db.String(100), nullable=True)

    # Role information
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)    
    role = db.relationship('Role')

    # Personal information
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)

    # Login information
    last_login = db.Column(db.DateTime(timezone=True))
    last_logout = db.Column(db.DateTime(timezone=True))
    accepted_at = db.Column(db.DateTime, nullable=True)

    # Password reset information
    reset_token = db.Column(db.String(128), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    # New invitation fields
    invitation_token = db.Column(db.String(128), nullable=True)
    invitation_expiry = db.Column(db.DateTime, nullable=True)
    invited_by = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=True)
    invited_at = db.Column(db.DateTime, nullable=True)

    # Email notification preferences
    email_notifications_enabled = db.Column(db.Boolean, default=True, nullable=False)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)

    def to_dict(self):
        return {
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.name.value,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'invited_by': self.invited_by,
            'invited_at': self.invited_at.isoformat() if self.invited_at else None,
            'is_active': bool(self.password_hash),  # User is active if they have a password
            'email_notifications_enabled': self.email_notifications_enabled
        }

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
    door_detector = 'Fotosel'
    control_unit = 'Kontrol Ünitesi'

class ProductModel(db.Model):
    __tablename__ = 'product_models'
    id = db.Column(db.Integer, primary_key=True)
    product_type = db.Column(db.Enum(ProductTypeEnum), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class CaseStatusEnum(Enum):
    DELIVERED = 'Teslim Alındı'
    TECHNICAL_REVIEW = 'Teknik İnceleme'
    PAYMENT_COLLECTION = 'Ödeme Tahsilatı'
    SHIPPING = 'Kargoya Veriliyor'
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

class FaultResponsibilityEnum(Enum):
    user_error = 'Kullanıcı Hatası'
    technical_issue = 'Teknik Sorun'
    mixed = 'Karışık'
    unknown = 'Bilinmiyor'

class ResolutionMethodEnum(Enum):
    repair = 'Tamir'
    free_replacement = 'Bedelsiz Değişim'
    old_product_none = 'Eski Ürün (Yok)'
    unknown = 'Bilinmiyor'

class ReturnCase(db.Model):
    __tablename__ = 'return_cases'

    id = db.Column(db.Integer, primary_key=True)

    # --- 1. Stage: DELIVERED ---
    # Fields to be filled by Support:
    #   - customer_id
    #   - arrival_date
    #   - receipt_method
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    arrival_date = db.Column(db.Date, nullable=False, default=datetime.utcnow, index=True)
    receipt_method = db.Column(db.Enum(ReceiptMethodEnum), nullable=False, default=ReceiptMethodEnum.shipment)
    notes = db.Column(db.Text, nullable=True)

    # --- 2. Stage: TECHNICAL_REVIEW ---
    # Fields to be filled by Technician:
    #   - items (product_type, product_model_id, product_count, serial_number, 
    #           warranty_status, fault_responsibility, production_date)
    #   - yedek_parca
    #   - bakim
    #   - iscilik
    #   - cost
    #   - performed_services
    items = db.relationship('ReturnCaseItem', back_populates='return_case', cascade='all, delete-orphan')
    yedek_parca = db.Column(db.Numeric(10, 2), nullable=True, default=0)
    bakim = db.Column(db.Numeric(10, 2), nullable=True, default=0)
    iscilik = db.Column(db.Numeric(10, 2), nullable=True, default=0)
    cost = db.Column(db.Numeric(10, 2), nullable=True, default=0)     
    performed_services = db.Column(db.Text, nullable=True)

    # --- 3. Stage: PAYMENT_COLLECTION ---
    # Fields to be filled by Sales:
    #   - payment_status
    payment_status = db.Column(db.Enum(PaymentStatusEnum), nullable=True)

    # --- 4. Stage: SHIPPING ---
    # Fields to be filled by Logistics:
    #   - shipping_info
    #   - tracking_number
    #   - shipping_date
    shipping_info = db.Column(db.String(255), nullable=True)
    tracking_number = db.Column(db.String(100), nullable=True)
    shipping_date = db.Column(db.Date, nullable=True)

    # Current workflow status of the return case
    workflow_status = db.Column(db.Enum(CaseStatusEnum), nullable=False, default=CaseStatusEnum.DELIVERED, index=True)

    # RELATIONSHIPS
    # Relationship to Customers; adds 'return_cases' to Customers for reverse access
    customer = db.relationship('Customers', backref=db.backref('return_cases', lazy=True))

    # Relationship to ReturnCaseItem; allows access to all items for a return case
    # The 'cascade' option ensures that when a ReturnCase is deleted, all its associated items are also deleted.
    items = db.relationship('ReturnCaseItem', back_populates='return_case', cascade='all, delete-orphan')


    def __repr__(self):
        return f'<ReturnCase id={self.id} customer_id={self.customer_id} status={self.workflow_status.value}>'

class ReturnCaseItem(db.Model):
    __tablename__ = 'return_case_items'

    id = db.Column(db.Integer, primary_key=True)
    return_case_id = db.Column(db.Integer, db.ForeignKey('return_cases.id'), nullable=False)

    # Information about the product
    product_model_id = db.Column(db.Integer, db.ForeignKey('product_models.id'), nullable=False)
    product_count = db.Column(db.Integer, nullable=False, default=1)
    
    # Changed from String to Date for production date (month-year format)
    production_date = db.Column(db.String(7), nullable=False)  # MM-YYYY format for production date


    # Warranty status of the product
    warranty_status = db.Column(db.Enum(WarrantyStatusEnum), nullable=True)

    # Fault responsibility - who is responsible for the issue
    fault_responsibility = db.Column(db.Enum(FaultResponsibilityEnum), nullable=True)

    # Resolution method - how the issue will be resolved
    resolution_method = db.Column(db.Enum(ResolutionMethodEnum), nullable=True)

    # Indicates whether this product has an attached control unit
    has_control_unit = db.Column(db.Boolean, default=False, nullable=True)

    
    # New fields for Teknik İnceleme stage
    cable_check = db.Column(db.Boolean, default=False, nullable=False)
    profile_check = db.Column(db.Boolean, default=False, nullable=False)
    packaging = db.Column(db.Boolean, default=False, nullable=False)

    
    # Relationship to the parent ReturnCase. This allows each ReturnCaseItem to access its associated ReturnCase object.
    # The 'back_populates' argument links this relationship to the 'items' relationship on the ReturnCase model,
    # enabling bidirectional access between ReturnCase and its items.
    return_case = db.relationship('ReturnCase', back_populates='items')

    # Relationship to the ProductModel. This allows each ReturnCaseItem to access its associated ProductModel object.
    # This is useful for retrieving detailed information about the specific product model for this item.
    product_model = db.relationship('ProductModel')

    ## ADDED NEW: THE RELATIONSHIP FOR SERVICES
    # Relationship to the ReturnCaseItemService. This allows each ReturnCaseItem to access its associated ReturnCaseItemService object.
    # The 'cascade' option ensures that when a ReturnCaseItem is deleted, all its associated ReturnCaseItemServices are also deleted.
    services = db.relationship('ReturnCaseItemService', back_populates='return_case_item', cascade='all, delete-orphan')


    def __repr__(self):
        return f'<ReturnCaseItem id={self.id} product_model_id={self.product_model_id} case_id={self.return_case_id}>'


class ActionType(Enum):
    CASE_CREATED = "CASE_CREATED"
    PRODUCT_CREATED = "PRODUCT_CREATED"
    PRODUCT_DELETED = "PRODUCT_DELETED"
    CUSTOMER_CREATED = "CUSTOMER_CREATED"
    CUSTOMER_DELETED = "CUSTOMER_DELETED"
    SERVICE_CREATED = "SERVICE_CREATED"
    SERVICE_DELETED = "SERVICE_DELETED"
    STAGE_DELIVERED_COMPLETED = "STAGE_DELIVERED_COMPLETED"
    STAGE_TECHNICAL_REVIEW_COMPLETED = "STAGE_TECHNICAL_REVIEW_COMPLETED"
    STAGE_PAYMENT_COLLECTION_COMPLETED = "STAGE_PAYMENT_COLLECTION_COMPLETED"
    STAGE_SHIPPING_COMPLETED = "STAGE_SHIPPING_COMPLETED"
    CASE_COMPLETED = "CASE_COMPLETED"
    EMAIL_SENT = "EMAIL_SENT"

class UserActionLog(db.Model):
    __tablename__ = 'user_action_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # User who performed the action
    user_email = db.Column(db.String(254), db.ForeignKey('users.email'), nullable=False)
    user = db.relationship('User')
    
    # Return case this action relates to - make it nullable
    return_case_id = db.Column(db.Integer, db.ForeignKey('return_cases.id'), nullable=True)  # Changed to nullable=True
    return_case = db.relationship('ReturnCase')
    
    # Action details
    action_type = db.Column(db.Enum(ActionType), nullable=False)
    
    # Additional context (for email address, etc.)
    additional_info = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    def __repr__(self):
        return f'<UserActionLog id={self.id} user={self.user_email} action={self.action_type.value} case={self.return_case_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'user_name': f"{self.user.first_name} {self.user.last_name}" if self.user else self.user_email,
            'return_case_id': self.return_case_id,
            'action_type': self.action_type.value,
            'additional_info': self.additional_info,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
## ADDED NEW: THESE NEW MODELS FOR SERVICES
class ServiceDefinition(db.Model):
    __tablename__ = 'service_definitions'
    id = db.Column(db.Integer, primary_key=True)
    product_type = db.Column(db.Enum(ProductTypeEnum), nullable=False)
    service_name = db.Column(db.String(100), nullable=False)

class ReturnCaseItemService(db.Model):
    __tablename__ = 'return_case_item_services'
    id = db.Column(db.Integer, primary_key=True)
    return_case_item_id = db.Column(db.Integer, db.ForeignKey('return_case_items.id'), nullable=False)
    service_definition_id = db.Column(db.Integer, db.ForeignKey('service_definitions.id'), nullable=False)
    is_performed = db.Column(db.Boolean, default=False, nullable=False)
    
    # Relationships
    return_case_item = db.relationship('ReturnCaseItem', back_populates='services')
    service_definition = db.relationship('ServiceDefinition')

