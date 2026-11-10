import logging
from datetime import datetime
from functools import wraps

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy.orm import joinedload, selectinload

from models import (
    ActionType, AppPermissions, CaseStatusEnum, Customers, ProductModel, ProductTypeEnum,
    ReceiptMethodEnum, ReturnCase, ReturnCaseItem, ReturnCaseItemService, ServiceDefinition, UserActionLog, db,
)
from permissions import permission_required
from serializers import serialize_case
from services.email_service import CentaEmailService
from services import audit
from workflow import STAGES, has_reached

logger = logging.getLogger(__name__)

return_case_bp = Blueprint('returns', __name__, url_prefix='/returns')


# --- Listing -----------------------------------------------------------------

def parse_filter_date(value):
    try:
        return datetime.strptime(value, '%Y-%m-%d')
    except ValueError:
        return None


def apply_case_filters(query, args):
    """Narrow the case list by the filters in the query string. A filter with
    an unrecognised value is ignored rather than rejected."""
    search = args.get('search', '').strip()
    status = args.get('status', '').strip()
    start_date = parse_filter_date(args.get('startDate', '').strip())
    end_date = parse_filter_date(args.get('endDate', '').strip())
    receipt_method = args.get('receiptMethod', '').strip()
    product_type = args.get('productType', '').strip()
    product_model = args.get('productModel', '').strip()

    if search:  # customer name only
        query = query.join(ReturnCase.customer).filter(Customers.name.ilike(f"%{search}%"))

    if status == 'not_completed':
        query = query.filter(ReturnCase.workflow_status != CaseStatusEnum.COMPLETED)
    elif status:
        # Statuses arrive as their Turkish label.
        match = next((s for s in CaseStatusEnum if s.value == status), None)
        if match:
            query = query.filter(ReturnCase.workflow_status == match)

    if start_date:
        query = query.filter(ReturnCase.arrival_date >= start_date)
    if end_date:
        query = query.filter(ReturnCase.arrival_date <= end_date)

    if receipt_method in ReceiptMethodEnum.__members__:
        query = query.filter(ReturnCase.receipt_method == ReceiptMethodEnum[receipt_method])

    # A case matches when at least one of its items does. Asking "does such an
    # item exist" (rather than joining to the items) keeps one row per case,
    # so page counts stay right when several items of a case match.
    item_conditions = []
    if product_type in ProductTypeEnum.__members__:
        item_conditions.append(
            ReturnCaseItem.product_model.has(ProductModel.product_type == ProductTypeEnum[product_type]))
    if product_model.isdigit():
        item_conditions.append(ReturnCaseItem.product_model_id == int(product_model))
    if item_conditions:
        query = query.filter(ReturnCase.items.any(db.and_(*item_conditions)))

    return query


@return_case_bp.route('', methods=['GET'])
@return_case_bp.route('/', methods=['GET'])
@permission_required(AppPermissions.PAGE_VIEW_CASE_TRACKING)
def get_return_cases():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))

        # Everything a case row shows is loaded up front, in a fixed number
        # of queries however many cases and items there are.
        items = selectinload(ReturnCase.items)
        query = ReturnCase.query.options(
            joinedload(ReturnCase.customer),
            items.joinedload(ReturnCaseItem.product_model),
            items.selectinload(ReturnCaseItem.services).joinedload(ReturnCaseItemService.service_definition),
        )
        query = apply_case_filters(query, request.args)
        # Newest arrival first; id breaks ties.
        query = query.order_by(ReturnCase.arrival_date.desc(), ReturnCase.id.desc())
        paginated = query.paginate(page=page, per_page=limit, error_out=False)

        return jsonify({
            "cases": [serialize_case(c) for c in paginated.items],
            "totalPages": paginated.pages,
            "currentPage": paginated.page,
            "totalItems": paginated.total,
            "hasNext": paginated.has_next,
            "hasPrev": paginated.has_prev,
        })
    except Exception as e:
        logger.exception("Error in get_return_cases")
        return jsonify({"error": f"Failed to fetch return cases: {str(e)}"}), 500


# --- Creating ----------------------------------------------------------------

@return_case_bp.route('/simple', methods=['POST'])
@permission_required(AppPermissions.CASE_CREATE)
def create_simple_return_case():
    data = request.get_json()
    customer_id = data.get('customerId')
    arrival_date = data.get('arrivalDate')
    receipt_method = data.get('receiptMethod')

    if not customer_id or not arrival_date or not receipt_method:
        return jsonify({'error': 'customerId, arrivalDate ve receiptMethod gereklidir.'}), 400

    customer = db.session.get(Customers, customer_id)
    if not customer:
        return jsonify({'error': f'{customer_id} ID\'li müşteri bulunamadı.'}), 404

    try:
        case = ReturnCase(
            customer_id=customer.id,
            arrival_date=datetime.strptime(arrival_date, '%Y-%m-%d'),
            receipt_method=ReceiptMethodEnum[receipt_method],
            notes=data.get('notes'),
            # workflow_status defaults to DELIVERED
        )
        db.session.add(case)
        db.session.flush()  # assigns the id
        audit.record(ActionType.CASE_CREATED, return_case_id=case.id)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    CentaEmailService.new_return_case_notification(case.id)
    return jsonify({'message': 'Arıza vakası oluşturuldu', 'caseId': case.id}), 201


# --- Stages: one "edit" and one "complete" route per entry in workflow.STAGES --

def role_required(role):
    """For the one stage whose editor is defined by role, not by permission."""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            if get_jwt().get("role") != role:
                return jsonify({"error": "Bu aşamayı düzenleme yetkiniz yok."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def update_stage(stage, return_case_id):
    """Save the fields that belong to `stage`. Allowed once the case has
    reached that stage, and still allowed after it has moved on."""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404
        if not has_reached(return_case, stage.status):
            return jsonify({
                "error": f"Bu aşama henüz düzenlenemez. Mevcut durum: {return_case.workflow_status.value}"
            }), 400

        problem = stage.update(return_case, request.get_json())
        if problem:
            message, status_code = problem
            db.session.rollback()
            return jsonify({"error": message}), status_code

        db.session.commit()
        return jsonify({"message": stage.updated_message}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500


def notify_stage_completed(stage, case_id):
    """Emails that follow a completed stage. Sent after the change is saved;
    the email service never raises, so a mail problem cannot undo it."""
    completed_by = get_jwt().get('name', 'Sistem')
    if stage.next_status is None:
        # The last stage: tell managers and admins the case is finished.
        CentaEmailService.send_case_completion_notification(case_id, completed_by=completed_by)
    elif current_app.config['STAGE_EMAILS_ENABLED']:
        CentaEmailService.send_stage_completion_notification(
            case_id, stage.status, stage.next_status, updated_by=completed_by)


def complete_stage(stage, return_case_id):
    """Check that `stage` is the case's current stage and that its required
    fields are filled in, then move the case to the next stage."""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404
        if return_case.workflow_status != stage.status:
            return jsonify({
                "error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"
            }), 400

        message = stage.validate(return_case)
        if message:
            return jsonify({"error": message}), 400

        if stage.next_status:
            return_case.workflow_status = stage.next_status
        if stage.completed_action:
            audit.record(stage.completed_action, return_case_id=return_case.id)
        db.session.commit()

        notify_stage_completed(stage, return_case.id)
        return jsonify({"message": stage.completed_message}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500


def register_stage_routes(stage):
    if stage.edit_permission:
        edit_guard = permission_required(stage.edit_permission)
    else:
        edit_guard = role_required(stage.edit_role)

    @edit_guard
    def update_view(return_case_id):
        return update_stage(stage, return_case_id)

    @permission_required(stage.complete_permission)
    def complete_view(return_case_id):
        return complete_stage(stage, return_case_id)

    return_case_bp.add_url_rule(
        f'/<int:return_case_id>/{stage.slug}', endpoint=f'update_{stage.key}',
        view_func=update_view, methods=['PUT'])
    return_case_bp.add_url_rule(
        f'/<int:return_case_id>/complete-{stage.slug}', endpoint=f'complete_{stage.key}',
        view_func=complete_view, methods=['POST'])


for _stage in STAGES:
    register_stage_routes(_stage)


# --- Deleting ----------------------------------------------------------------

DELETABLE_STATUSES = {CaseStatusEnum.DELIVERED, CaseStatusEnum.TECHNICAL_REVIEW}
ROLES_ALLOWED_TO_DELETE = {'SUPPORT', 'MANAGER', 'ADMIN'}


@return_case_bp.route('/<int:return_case_id>', methods=['DELETE'])
@jwt_required()
def delete_return_case(return_case_id):
    return_case = db.session.get(ReturnCase, return_case_id)
    if not return_case:
        return jsonify({'msg': 'Vaka bulunamadı.'}), 404

    # A case can only be deleted in its first two stages, and only by these roles.
    if return_case.workflow_status not in DELETABLE_STATUSES:
        return jsonify({'msg': 'Bu durumdaki vakalar silinemez.'}), 403
    if get_jwt().get("role") not in ROLES_ALLOWED_TO_DELETE:
        return jsonify({'msg': 'Bu vakayı silmek için SUPPORT, MANAGER veya ADMIN rolüne sahip olmanız gerekiyor.'}), 403

    try:
        # The case's audit log entries go with it.
        UserActionLog.query.filter_by(return_case_id=return_case_id).delete()
        db.session.delete(return_case)
        db.session.commit()
        return jsonify({'msg': f'Vaka {return_case_id} başarıyla silindi.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Silme işlemi sırasında bir hata oluştu.', 'error': str(e)}), 500


# --- Emailing the customer ---------------------------------------------------

@return_case_bp.route('/<int:return_case_id>/send-customer-email', methods=['POST'])
@permission_required(AppPermissions.CASE_EDIT_SHIPPING)
def send_customer_email(return_case_id):
    """Send email to customer about their return case"""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        data = request.get_json()
        email_content = data.get('emailContent', '').strip()
        recipient_email = data.get('recipientEmail', '').strip()

        if not email_content:
            return jsonify({"error": "E-posta içeriği gereklidir"}), 400
        if not recipient_email:
            return jsonify({"error": "Alıcı e-posta adresi gereklidir"}), 400
        if not return_case.customer:
            return jsonify({"error": "Müşteri bilgisi bulunamadı"}), 404

        if CentaEmailService.send_custom_customer_email(recipient_email, return_case_id, email_content):
            return jsonify({"message": "E-posta başarıyla gönderildi"}), 200
        return jsonify({"error": "E-posta gönderilemedi"}), 500

    except Exception as e:
        logger.error("Error sending customer email for case %s: %s", return_case_id, e)
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500


# --- Fault types available for a product type --------------------------------

@return_case_bp.route('/service-definitions/<product_type>', methods=['GET'])
@permission_required(AppPermissions.CASE_EDIT_TECHNICAL_REVIEW)
def get_service_definitions(product_type):
    if product_type not in ProductTypeEnum.__members__:
        return jsonify({"error": "Invalid product type"}), 400

    definitions = ServiceDefinition.query.filter_by(product_type=ProductTypeEnum[product_type]).all()
    return jsonify({"services": [
        {"id": d.id, "service_name": d.service_name, "product_type": d.product_type.value}
        for d in definitions
    ]}), 200
