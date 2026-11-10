"""The return-case workflow, described in one place.

A case moves through five stages in order. Each stage has an owner (expressed
as permissions), a set of fields that owner fills in, and rules that must hold
before the stage can be completed. STAGES at the bottom of this file is the
single description of all of that; endpoints/returns.py turns it into routes.
"""
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Callable, Optional

from models import (
    ActionType, AppPermissions, CaseStatusEnum, Customers, FaultResponsibilityEnum,
    PaymentStatusEnum, ReceiptMethodEnum, ResolutionMethodEnum, ReturnCaseItem,
    ReturnCaseItemService, WarrantyStatusEnum, db,
)

STAGE_ORDER = list(CaseStatusEnum)


def has_reached(return_case, status):
    """True once the case is at `status` or beyond it."""
    return STAGE_ORDER.index(return_case.workflow_status) >= STAGE_ORDER.index(status)


def enum_from(enum_class, value, required=False):
    """Read an enum sent by the interface, which may send either the Turkish
    label ("Garanti Dahilinde") or the key ("in_warranty").

    Blank means "not set": None, or KeyError when the field is required.
    Anything unrecognised raises KeyError.
    """
    if not value or not str(value).strip():
        if required:
            raise KeyError(f"{enum_class.__name__} value is required")
        return None
    for member in enum_class:
        if member.value == value:
            return member
    return enum_class[value]


def parse_date(value):
    return datetime.strptime(value, '%Y-%m-%d').date()


def money(value):
    return Decimal(str(value or 0))


# --- Stage 1: Teslim Alındı (Support) ---------------------------------------

def update_delivered(case, data):
    if 'customerId' in data:
        if not db.session.get(Customers, data['customerId']):
            return "Müşteri bulunamadı", 404
        case.customer_id = data['customerId']
    if 'arrivalDate' in data:
        case.arrival_date = parse_date(data['arrivalDate'])
    if 'receiptMethod' in data:
        case.receipt_method = enum_from(ReceiptMethodEnum, data['receiptMethod'], required=True)
    if 'notes' in data:
        case.notes = data['notes']


def validate_delivered(case):
    if not case.customer_id:
        return "Müşteri bilgisi eksik. Lütfen müşteri seçin."
    if not case.arrival_date:
        return "Geliş tarihi eksik. Lütfen geliş tarihini belirtin."
    if not case.receipt_method:
        return "Teslim alma yöntemi eksik. Lütfen teslim alma yöntemini seçin."


# --- Stage 2: Teknik İnceleme (Technician) ----------------------------------

def build_item(item_data):
    item = ReturnCaseItem(
        product_model_id=item_data['product_model_id'],
        product_count=item_data['product_count'],
        production_date=item_data.get('production_date'),
        warranty_status=enum_from(WarrantyStatusEnum, item_data.get('warranty_status')),
        fault_responsibility=enum_from(FaultResponsibilityEnum, item_data.get('fault_responsibility')),
        resolution_method=enum_from(ResolutionMethodEnum, item_data.get('resolution_method')),
        has_control_unit=item_data.get('has_control_unit', False),
        cable_check=item_data.get('cable_check', False),
        profile_check=item_data.get('profile_check', False),
        packaging=item_data.get('packaging', False),
    )
    for service_data in item_data.get('services', []):
        item.services.append(ReturnCaseItemService(
            service_definition_id=service_data['service_definition_id'],
            is_performed=service_data.get('is_performed', False),
        ))
    return item


def update_technical_review(case, data):
    for field in ('yedek_parca', 'bakim', 'iscilik'):
        if field in data:
            setattr(case, field, money(data[field]))
    case.cost = money(case.yedek_parca) + money(case.bakim) + money(case.iscilik)

    if 'performed_services' in data:
        case.performed_services = data['performed_services']

    if 'items' in data:
        # The item list is replaced as a whole. Build every new item first so
        # that a bad value leaves the existing items untouched.
        new_items = [build_item(item_data) for item_data in data['items']]
        case.items.clear()
        db.session.flush()
        case.items.extend(new_items)


def validate_production_date(value):
    if not value:
        return "Üretim tarihi eksik. Lütfen tüm ürünler için üretim tarihini belirtin."
    try:
        produced = datetime.strptime(value, "%Y-%m")
    except Exception:
        return "Üretim tarihi formatı geçersiz. Lütfen YYYY-MM formatında girin."
    now = datetime.now()
    if (produced.year, produced.month) > (now.year, now.month):
        return "Üretim tarihi gelecekte olamaz. Lütfen geçerli bir tarih girin."


def validate_item(item):
    if not item.product_model_id:
        return "Ürün modeli eksik. Lütfen tüm ürünler için model seçin."
    if not item.product_count or item.product_count <= 0:
        return "Ürün adeti eksik. Lütfen tüm ürünler için adet belirtin."
    error = validate_production_date(item.production_date)
    if error:
        return error
    if not item.warranty_status:
        return "Garanti durumu eksik. Lütfen tüm ürünler için garanti durumunu belirtin."
    if not item.fault_responsibility:
        return "Hata sorumluluğu eksik. Lütfen tüm ürünler için hata sorumluluğunu belirtin."
    if not item.resolution_method:
        return "Çözüm yöntemi eksik. Lütfen tüm ürünler için çözüm yöntemini belirtin."
    if not any(service.is_performed for service in item.services):
        name = item.product_model.name if item.product_model else 'Bilinmeyen'
        return f"En az bir hizmet seçilmelidir. Ürün: {name}"


def validate_technical_review(case):
    if not case.items:
        return "Ürün bilgileri eksik. Lütfen en az bir ürün ekleyin."
    for item in case.items:
        error = validate_item(item)
        if error:
            return error
    for field, message in (
        ('yedek_parca', "Yedek Parça tutarı eksik. Lütfen yedek parça tutarını belirtin."),
        ('bakim', "Bakım tutarı eksik. Lütfen bakım tutarını belirtin."),
        ('iscilik', "İşçilik tutarı eksik. Lütfen işçilik tutarını belirtin."),
    ):
        amount = getattr(case, field)
        if amount is None or amount < 0:
            return message
    if not case.performed_services or not case.performed_services.strip():
        return "Teknik servis notu eksik. Lütfen teknik servis notunu belirtin."


# --- Stage 3: Ödeme Tahsilatı (Sales) ---------------------------------------

def update_payment_collection(case, data):
    if 'payment_status' in data:
        status = enum_from(PaymentStatusEnum, data['payment_status'])
        if status:
            case.payment_status = status


def validate_payment_collection(case):
    if not case.payment_status:
        return "Ödeme durumu eksik. Lütfen ödeme durumunu belirtin."
    if case.payment_status not in (PaymentStatusEnum.waived, PaymentStatusEnum.paid):
        return "Ödeme tahsilatı aşaması tamamlanamaz. Ödeme durumu 'Ücretsiz' veya 'Ödendi' olmalıdır."


# --- Stage 4: Kargoya Veriliyor (Logistics) ---------------------------------

def update_shipping(case, data):
    if 'shippingInfo' in data:
        case.shipping_info = data['shippingInfo']
    if 'trackingNumber' in data:
        case.tracking_number = data['trackingNumber']
    if data.get('shippingDate'):
        case.shipping_date = parse_date(data['shippingDate'])


def validate_shipping(case):
    if not case.shipping_info:
        return "Kargo bilgisi eksik. Lütfen kargo bilgisini belirtin."
    if not case.tracking_number:
        return "Takip numarası eksik. Lütfen takip numarasını belirtin."
    if not case.shipping_date:
        return "Kargo tarihi eksik. Lütfen kargo tarihini belirtin."


# --- Stage 5: Tamamlandı (Manager) ------------------------------------------

def update_completed(case, data):
    if 'paymentStatus' in data:
        case.payment_status = enum_from(PaymentStatusEnum, data['paymentStatus'], required=True)


def validate_completed(case):
    if not case.payment_status:
        return "Ödeme durumu eksik. Lütfen ödeme durumunu belirtin."


# --- The table ---------------------------------------------------------------

@dataclass(frozen=True)
class Stage:
    key: str                                   # name used for the Flask endpoints
    slug: str                                  # URL part: /returns/<id>/<slug>
    status: CaseStatusEnum                     # the case status this stage corresponds to
    next_status: Optional[CaseStatusEnum]      # where completing it leads; None for the last stage
    complete_permission: AppPermissions        # who may complete it
    update: Callable                           # (case, data) -> None, or (error message, http status)
    validate: Callable                         # (case) -> None, or an error message
    updated_message: str
    completed_message: str
    edit_permission: Optional[AppPermissions] = None   # who may edit its fields ...
    edit_role: Optional[str] = None                     # ... or, where no permission exists, which role
    completed_action: Optional[ActionType] = None       # audit log entry written on completion


STAGES = [
    Stage(
        key='teslim_alindi', slug='teslim-alindi',
        status=CaseStatusEnum.DELIVERED, next_status=CaseStatusEnum.TECHNICAL_REVIEW,
        edit_permission=AppPermissions.CASE_EDIT_DELIVERED,
        complete_permission=AppPermissions.CASE_COMPLETE_DELIVERED,
        update=update_delivered, validate=validate_delivered,
        updated_message="Teslim Alındı bilgileri güncellendi",
        completed_message="Teslim Alındı aşaması tamamlandı, durum Teknik İnceleme olarak güncellendi",
        completed_action=ActionType.STAGE_DELIVERED_COMPLETED,
    ),
    Stage(
        key='teknik_inceleme', slug='teknik-inceleme',
        status=CaseStatusEnum.TECHNICAL_REVIEW, next_status=CaseStatusEnum.PAYMENT_COLLECTION,
        edit_permission=AppPermissions.CASE_EDIT_TECHNICAL_REVIEW,
        complete_permission=AppPermissions.CASE_COMPLETE_TECHNICAL_REVIEW,
        update=update_technical_review, validate=validate_technical_review,
        updated_message="Teknik İnceleme bilgileri güncellendi",
        completed_message="Teknik İnceleme aşaması tamamlandı, durum Ödeme Tahsilatı olarak güncellendi",
        completed_action=ActionType.STAGE_TECHNICAL_REVIEW_COMPLETED,
    ),
    Stage(
        key='odeme_tahsilati', slug='odeme-tahsilati',
        status=CaseStatusEnum.PAYMENT_COLLECTION, next_status=CaseStatusEnum.SHIPPING,
        edit_permission=AppPermissions.CASE_EDIT_PAYMENT_COLLECTION,
        complete_permission=AppPermissions.CASE_COMPLETE_PAYMENT_COLLECTION,
        update=update_payment_collection, validate=validate_payment_collection,
        updated_message="Ödeme tahsilatı bilgileri güncellendi",
        completed_message="Ödeme tahsilatı aşaması tamamlandı, durum Kargoya Veriliyor olarak güncellendi",
        completed_action=ActionType.STAGE_PAYMENT_COLLECTION_COMPLETED,
    ),
    Stage(
        key='kargoya_verildi', slug='kargoya-verildi',
        status=CaseStatusEnum.SHIPPING, next_status=CaseStatusEnum.COMPLETED,
        edit_permission=AppPermissions.CASE_EDIT_SHIPPING,
        complete_permission=AppPermissions.CASE_COMPLETE_SHIPPING,
        update=update_shipping, validate=validate_shipping,
        updated_message="Kargo bilgileri güncellendi",
        completed_message="Kargoya Verildi aşaması tamamlandı, durum Tamamlandı olarak güncellendi",
        completed_action=ActionType.STAGE_SHIPPING_COMPLETED,
    ),
    Stage(
        key='tamamlandi', slug='tamamlandi',
        status=CaseStatusEnum.COMPLETED, next_status=None,
        # No role holds an edit permission for this stage; the interface lets
        # the manager edit it, and the API enforces the same.
        edit_role='MANAGER',
        complete_permission=AppPermissions.CASE_COMPLETE_COMPLETED,
        update=update_completed, validate=validate_completed,
        updated_message="Tamamlandı bilgileri güncellendi",
        completed_message="Tamamlandı aşaması tamamlandı",
    ),
]
