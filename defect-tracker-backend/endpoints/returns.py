import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import AppPermissions, Role, User, UserRole, WarrantyStatusEnum, PaymentStatusEnum, db, ReturnCase, ReturnCaseItem, ProductTypeEnum, ReceiptMethodEnum, CaseStatusEnum, Customers, ProductModel, FaultResponsibilityEnum, ResolutionMethodEnum, ServiceTypeEnum
from datetime import datetime
from sqlalchemy.orm import joinedload
from permissions import permission_required
from services.email_service import CentaEmailService

def get_current_user():
    """Get current user from JWT token"""
    try:
        identity = get_jwt_identity()
        claims = get_jwt()
        return {
            'id': identity,
            'role': claims.get('role'),
            'name': claims.get('name', 'Sistem')
        }
    except:
        return {'id': None, 'role': None, 'name': 'Sistem'}

def convert_turkish_to_enum(turkish_value, enum_class):
    """Convert Turkish display values to enum keys"""
    if not turkish_value or not turkish_value.strip():
        return None
    for enum_item in enum_class:
        if enum_item.value == turkish_value:
            return enum_item.name
    return turkish_value  

return_case_bp = Blueprint('returns', __name__, url_prefix='/returns')

@return_case_bp.route('', methods=['GET'])
@return_case_bp.route('/', methods=['GET'])
def get_return_cases():
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        # Get filter parameters
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        start_date = request.args.get('startDate', '').strip()
        end_date = request.args.get('endDate', '').strip()
        receipt_method = request.args.get('receiptMethod', '').strip()
        product_type = request.args.get('productType', '').strip()
        product_model = request.args.get('productModel', '').strip()

        # Start with base query
        query = ReturnCase.query.options(
            joinedload(ReturnCase.customer),
            joinedload(ReturnCase.items).joinedload(ReturnCaseItem.product_model)
        )

        # Apply search filter (customer name only)
        if search:
            search_term = f"%{search}%"
            try:
                query = query.join(ReturnCase.customer).filter(
                    db.func.lower(Customers.name).ilike(search_term.lower())
                )
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        # Apply status filter
        if status:
            if status == 'not_completed':
                query = query.filter(ReturnCase.workflow_status != CaseStatusEnum.COMPLETED)
            else:
                try:
                    # Try to find the status by its Turkish value
                    status_enum = None
                    for enum_value in CaseStatusEnum:
                        if enum_value.value == status:
                            status_enum = enum_value
                            break
                    
                    if status_enum:
                        query = query.filter(ReturnCase.workflow_status == status_enum)
                except (KeyError, ValueError):
                    pass  # Invalid status, ignore filter

        # Apply date range filters
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(ReturnCase.arrival_date >= start_date_obj)
            except ValueError:
                pass  # Invalid date format, ignore filter

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(ReturnCase.arrival_date <= end_date_obj)
            except ValueError:
                pass  # Invalid date format, ignore filter



        # Apply receipt method filter
        if receipt_method:
            try:
                receipt_enum = ReceiptMethodEnum[receipt_method]
                query = query.filter(ReturnCase.receipt_method == receipt_enum)
            except (KeyError, ValueError):
                pass  # Invalid receipt method, ignore filter

        # Apply product type and model filters
        if product_type or product_model:
            # Use a simple approach with JOIN
            query = query.join(ReturnCase.items).join(ReturnCaseItem.product_model)
            
            if product_type:
                try:
                    product_enum = ProductTypeEnum[product_type]
                    query = query.filter(ProductModel.product_type == product_enum)
                except (KeyError, ValueError):
                    pass  # Invalid product type, ignore filter
            
            if product_model:
                try:
                    product_model_id = int(product_model)
                    query = query.filter(ReturnCaseItem.product_model_id == product_model_id)
                except (ValueError):
                    pass  # Invalid product model ID, ignore filter

        # Order by arrival date descending, then by id descending as tie-breaker
        query = query.order_by(ReturnCase.arrival_date.desc(), ReturnCase.id.desc())

        # Get total count before pagination
        total_cases = query.count()
        
        # Apply pagination
        cases = query.offset(offset).limit(limit).all()

        def serialize_item(item):
            return {
                "id": item.id,
                "product_model": {
                    "id": item.product_model.id if item.product_model else None,
                    "name": item.product_model.name if item.product_model else "Bilinmeyen Ürün",
                    "product_type": item.product_model.product_type.value if item.product_model else None
                },
                "product_count": item.product_count,
                "production_date": item.production_date,
                "has_control_unit": item.has_control_unit,
                "warranty_status": item.warranty_status.value if item.warranty_status else None,
                "fault_responsibility": item.fault_responsibility.value if item.fault_responsibility else None,
                "resolution_method": item.resolution_method.value if item.resolution_method else None,

                "service_type": item.service_type.value if item.service_type else None,
                "cable_check": item.cable_check,
                "profile_check": item.profile_check,
                "packaging": item.packaging,
                "yapilan_islemler": item.yapilan_islemler
            }

        data = [{
            "id": c.id,
            "status": c.workflow_status.value if c.workflow_status else None,
            "customer": {
                "id": c.customer.id if c.customer else None,
                "name": c.customer.name if c.customer else "Bilinmeyen Müşteri",
                "contact_info": c.customer.contact_info if c.customer else None,
                "address": c.customer.address if c.customer else None
            },
            "arrival_date": c.arrival_date.isoformat() if c.arrival_date else None,
            "receipt_method": c.receipt_method.value if c.receipt_method else None,
            "notes": c.notes,
            "shipping_info": c.shipping_info,
            "tracking_number": c.tracking_number,
            "shipping_date": c.shipping_date.isoformat() if c.shipping_date else None,
            "payment_status": c.payment_status.value if c.payment_status else None,
            "yedek_parca": float(c.yedek_parca) if c.yedek_parca is not None else 0,
            "bakim": float(c.bakim) if c.bakim is not None else 0,
            "iscilik": float(c.iscilik) if c.iscilik is not None else 0,
            "cost": float(c.cost) if c.cost is not None else 0,
            "performed_services": c.performed_services,
            "items": [serialize_item(i) for i in c.items]
        } for c in cases]

        return jsonify({
            "cases": data,
            "totalPages": (total_cases + limit - 1) // limit
        })

    except Exception as e:
        print(f"Error in get_return_cases: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch return cases: {str(e)}"}), 500

@return_case_bp.route('/simple', methods=['POST'])
def create_simple_return_case():
    data = request.get_json()
    customer_id = data.get('customerId')
    arrival_date = data.get('arrivalDate')
    receipt_method = data.get('receiptMethod')
    notes = data.get('notes')

    if not customer_id or not arrival_date or not receipt_method:
        return jsonify({'error': 'customerId, arrivalDate ve receiptMethod gereklidir.'}), 400

    # Look up customer by id
    customer = db.session.get(Customers, customer_id)
    if not customer:
        return jsonify({'error': f'{customer_id} ID\'li müşteri bulunamadı.'}), 404

    try:
        case = ReturnCase(
            customer_id=customer.id,
            arrival_date=datetime.strptime(arrival_date, '%Y-%m-%d'),
            receipt_method=ReceiptMethodEnum[receipt_method],
            notes=notes,
            # workflow_status defaults to DELIVERED
        )
        db.session.add(case)
        db.session.commit()

        # Send notification to all users
        CentaEmailService.new_return_case_notification(case.id)

        return jsonify({'message': 'İade vakası oluşturuldu', 'caseId': case.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Teslim Alındı Stage ----------------------------------------------------------

# Edit Button used by Support
@return_case_bp.route('/<int:return_case_id>/teslim-alindi', methods=['PUT'])
@permission_required(AppPermissions.CASE_EDIT_DELIVERED)
def update_teslim_alindi(return_case_id):
    """Update Teslim Alındı stage information"""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        data = request.get_json()
        
        # Update customer if provided
        if 'customerId' in data:
            customer = db.session.get(Customers, data['customerId'])
            if not customer:
                return jsonify({"error": "Müşteri bulunamadı"}), 404
            return_case.customer_id = data['customerId']
        
        # Update arrival date if provided
        if 'arrivalDate' in data:
            return_case.arrival_date = datetime.strptime(data['arrivalDate'], '%Y-%m-%d').date()
        
        # Update receipt method if provided
        if 'receiptMethod' in data:
            receipt_method_key = convert_turkish_to_enum(data['receiptMethod'], ReceiptMethodEnum)
            return_case.receipt_method = ReceiptMethodEnum[receipt_method_key]
        
        # Update notes if provided
        if 'notes' in data:
            return_case.notes = data['notes']
        
        db.session.commit()
        return jsonify({"message": "Teslim Alındı bilgileri güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Complete Button used by Support
@return_case_bp.route('/<int:return_case_id>/complete-teslim-alindi', methods=['POST'])
@permission_required(AppPermissions.CASE_COMPLETE_DELIVERED)
def complete_teslim_alindi(return_case_id):
    """Complete Teslim Alındı stage and move to Technical Review"""
    current_user = get_current_user()
    current_user_name = current_user.get('name', 'Sistem')
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        if return_case.workflow_status != CaseStatusEnum.DELIVERED:
            return jsonify({"error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"}), 400

        # Validate required fields for Teslim Alındı stage
        if not return_case.customer_id:
            return jsonify({"error": "Müşteri bilgisi eksik. Lütfen müşteri seçin."}), 400
        
        if not return_case.arrival_date:
            return jsonify({"error": "Geliş tarihi eksik. Lütfen geliş tarihini belirtin."}), 400
        
        if not return_case.receipt_method:
            return jsonify({"error": "Teslim alma yöntemi eksik. Lütfen teslim alma yöntemini seçin."}), 400

        return_case.workflow_status = CaseStatusEnum.TECHNICAL_REVIEW
        # Send email notification
        try:
            CentaEmailService.send_stage_completion_notification(
                case_id=return_case.id,
                completed_stage="Teslim Alındı",
                next_stage="Teknik İnceleme",
                updated_by=current_user_name
            )
        except Exception as e:
            logging.error(f"Email notification error for case {return_case.id}: {e}")
        
        db.session.commit()
        return jsonify({"message": "Teslim Alındı aşaması tamamlandı, durum Teknik İnceleme olarak güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Teknik İnceleme Stage ----------------------------------------------------------

# Edit Button used by Technician
@return_case_bp.route('/<int:return_case_id>/teknik-inceleme', methods=['PUT'])
@permission_required(AppPermissions.CASE_EDIT_TECHNICAL_REVIEW)
def update_teknik_inceleme(return_case_id):
    """Update Teknik İnceleme stage information"""
    try:
        print(f"Updating teknik inceleme for case {return_case_id}")
        data = request.get_json()
        print(f"Received data: {data}")
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        
        # Update cost fields if provided
        if 'yedek_parca' in data:
            return_case.yedek_parca = data['yedek_parca'] or 0
        if 'bakim' in data:
            return_case.bakim = data['bakim'] or 0
        if 'iscilik' in data:
            return_case.iscilik = data['iscilik'] or 0
        
        # Calculate total cost
        yedek_parca = return_case.yedek_parca or 0
        bakim = return_case.bakim or 0
        iscilik = return_case.iscilik or 0
        return_case.cost = yedek_parca + bakim + iscilik
        
        # Update performed_services at case level
        if 'performed_services' in data:
            return_case.performed_services = data['performed_services']
        
        if 'items' in data:
            # Clear existing items
            ReturnCaseItem.query.filter_by(return_case_id=return_case_id).delete()
            
            # Add new items
            for item_data in data['items']:
                print(f"Processing item: {item_data}")
                # Handle empty strings for enum fields - set to None if empty
                warranty_status = None
                if item_data.get('warranty_status') and item_data['warranty_status'].strip():
                    warranty_key = convert_turkish_to_enum(item_data['warranty_status'], WarrantyStatusEnum)
                    if warranty_key:
                        warranty_status = WarrantyStatusEnum[warranty_key]
                
                fault_responsibility = None
                if item_data.get('fault_responsibility') and item_data['fault_responsibility'].strip():
                    fault_resp_key = convert_turkish_to_enum(item_data['fault_responsibility'], FaultResponsibilityEnum)
                    if fault_resp_key:
                        fault_responsibility = FaultResponsibilityEnum[fault_resp_key]
                
                resolution_method = None
                if item_data.get('resolution_method') and item_data['resolution_method'].strip():
                    resolution_key = convert_turkish_to_enum(item_data['resolution_method'], ResolutionMethodEnum)
                    if resolution_key:
                        resolution_method = ResolutionMethodEnum[resolution_key]
                
                service_type = None
                if item_data.get('service_type') and item_data['service_type'].strip():
                    service_type_key = convert_turkish_to_enum(item_data['service_type'], ServiceTypeEnum)
                    if service_type_key:
                        service_type = ServiceTypeEnum[service_type_key]

                new_item = ReturnCaseItem(
                    return_case_id=return_case_id,
                    product_model_id=item_data['product_model_id'],
                    product_count=item_data['product_count'],
                    production_date=item_data.get('production_date'),
                    warranty_status=warranty_status,
                    fault_responsibility=fault_responsibility,
                    resolution_method=resolution_method,
                    has_control_unit=item_data.get('has_control_unit', False),
                    service_type=service_type,
                    cable_check=item_data.get('cable_check', False),
                    profile_check=item_data.get('profile_check', False),
                    packaging=item_data.get('packaging', False),
                    yapilan_islemler=item_data.get('yapilan_islemler')
                )
                db.session.add(new_item)
        
        db.session.commit()
        return jsonify({"message": "Teknik İnceleme bilgileri güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Complete Button used by Technician
@return_case_bp.route('/<int:return_case_id>/complete-teknik-inceleme', methods=['POST'])
@permission_required(AppPermissions.CASE_COMPLETE_TECHNICAL_REVIEW)
def complete_teknik_inceleme(return_case_id):
    """Complete Teknik İnceleme stage and move to Documentation"""
    current_user = get_current_user()
    current_user_name = current_user.get('name', 'Sistem')
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        if return_case.workflow_status != CaseStatusEnum.TECHNICAL_REVIEW:
            return jsonify({"error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"}), 400

        # Validate required fields for Teknik İnceleme stage
        if not return_case.items or len(return_case.items) == 0:
            return jsonify({"error": "Ürün bilgileri eksik. Lütfen en az bir ürün ekleyin."}), 400
        
        # Check if all items have required fields for Teknik İnceleme completion
        for item in return_case.items:
            if not item.product_model_id:
                return jsonify({"error": "Ürün modeli eksik. Lütfen tüm ürünler için model seçin."}), 400
            
            if not item.product_count or item.product_count <= 0:
                return jsonify({"error": "Ürün adeti eksik. Lütfen tüm ürünler için adet belirtin."}), 400
            
            if not item.production_date:
                return jsonify({"error": "Üretim tarihi eksik. Lütfen tüm ürünler için üretim tarihini belirtin."}), 400
            try:
                # Format: YYYY-MM
                dt = datetime.strptime(item.production_date, "%Y-%m")
                now = datetime.now()
                # Compare year and month only
                if (dt.year > now.year) or (dt.year == now.year and dt.month > now.month):
                    return jsonify({"error": "Üretim tarihi gelecekte olamaz. Lütfen geçerli bir tarih girin."}), 400
            except Exception:
                return jsonify({"error": "Üretim tarihi formatı geçersiz. Lütfen YYYY-MM formatında girin."}), 400
            
            if not item.warranty_status:
                return jsonify({"error": "Garanti durumu eksik. Lütfen tüm ürünler için garanti durumunu belirtin."}), 400
            
            if not item.fault_responsibility:
                return jsonify({"error": "Hata sorumluluğu eksik. Lütfen tüm ürünler için hata sorumluluğunu belirtin."}), 400
            
            if not item.resolution_method:
                return jsonify({"error": "Çözüm yöntemi eksik. Lütfen tüm ürünler için çözüm yöntemini belirtin."}), 400
            
            if not item.service_type:
                return jsonify({"error": "Hizmet türü eksik. Lütfen tüm ürünler için hizmet türünü belirtin."}), 400
              
            if not item.cable_check:
                return jsonify({"error": "Kablo kontrol eksik. Lütfen tüm ürünler için kablo kontrolünü tamamlayın."}), 400
            
            if not item.profile_check:
                return jsonify({"error": "Profil kontrol eksik. Lütfen tüm ürünler için profil kontrolünü tamamlayın."}), 400
            
            if not item.packaging:
                return jsonify({"error": "Paketleme eksik. Lütfen tüm ürünler için paketlemeyi tamamlayın."}), 400
            
            if not item.yapilan_islemler or not item.yapilan_islemler.strip():
                return jsonify({"error": "Yapılan İşlemler eksik. Lütfen tüm ürünler için yapılan işlemleri belirtin."}), 400

        # Validate cost fields for Teknik İnceleme completion
        if return_case.yedek_parca is None or return_case.yedek_parca < 0:
            return jsonify({"error": "Yedek Parça tutarı eksik. Lütfen yedek parça tutarını belirtin."}), 400
        
        if return_case.bakim is None or return_case.bakim < 0:
            return jsonify({"error": "Bakım tutarı eksik. Lütfen bakım tutarını belirtin."}), 400
        
        if return_case.iscilik is None or return_case.iscilik < 0:
            return jsonify({"error": "İşçilik tutarı eksik. Lütfen işçilik tutarını belirtin."}), 400

        # Validate performed_services at case level
        if not return_case.performed_services or not return_case.performed_services.strip():
            return jsonify({"error": "Teknik servis notu eksik. Lütfen teknik servis notunu belirtin."}), 400

        return_case.workflow_status = CaseStatusEnum.PAYMENT_COLLECTION
        try:
            CentaEmailService.send_stage_completion_notification(
                case_id=return_case.id,
                completed_stage="Teknik İnceleme",
                next_stage="Ödeme Tahsilatı",
                updated_by=current_user_name
            )
        except Exception as e:
            logging.error(f"Email notification error for case {return_case.id}: {e}")

        db.session.commit()
        return jsonify({"message": "Teknik İnceleme aşaması tamamlandı, durum Ödeme Tahsilatı olarak güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Ödeme Tahsilatı Stage ----------------------------------------------------------

# Edit Button used by Support
@return_case_bp.route('/<int:return_case_id>/odeme-tahsilati', methods=['PUT'])
@permission_required(AppPermissions.CASE_EDIT_PAYMENT_COLLECTION)
def update_odeme_tahsilati(return_case_id):
    """Update Ödeme Tahsilatı stage information"""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        data = request.get_json()
        
        # Update payment status if provided
        if 'payment_status' in data:
            payment_status_key = convert_turkish_to_enum(data['payment_status'], PaymentStatusEnum)
            if payment_status_key:
                return_case.payment_status = PaymentStatusEnum[payment_status_key]

        db.session.commit()
        return jsonify({"message": "Ödeme tahsilatı bilgileri güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Complete Button used by Support
@return_case_bp.route('/<int:return_case_id>/complete-odeme-tahsilati', methods=['POST'])
@permission_required(AppPermissions.CASE_COMPLETE_PAYMENT_COLLECTION)
def complete_odeme_tahsilati(return_case_id):
    """Complete Ödeme Tahsilatı stage and move to Shipping"""
    current_user = get_current_user()
    current_user_name = current_user.get('name', 'Sistem')
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        if return_case.workflow_status != CaseStatusEnum.PAYMENT_COLLECTION:
            return jsonify({"error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"}), 400

        # Validate required fields for Ödeme Tahsilatı stage
        if not return_case.payment_status:
            return jsonify({"error": "Ödeme durumu eksik. Lütfen ödeme durumunu belirtin."}), 400
        
        # Check if payment status is either 'Ücretsiz' or 'Ödendi'
        if return_case.payment_status not in [PaymentStatusEnum.waived, PaymentStatusEnum.paid]:
            return jsonify({"error": "Ödeme tahsilatı aşaması tamamlanamaz. Ödeme durumu 'Ücretsiz' veya 'Ödendi' olmalıdır."}), 400

        return_case.workflow_status = CaseStatusEnum.SHIPPING
        try:
            CentaEmailService.send_stage_completion_notification(
                case_id=return_case.id,
                completed_stage="Ödeme Tahsilatı",
                next_stage="Kargoya Verildi",
                updated_by=current_user_name
            )
        except Exception as e:
            logging.error(f"Email notification error for case {return_case.id}: {e}")
        db.session.commit()
        return jsonify({"message": "Ödeme tahsilatı aşaması tamamlandı, durum Kargoya Veriliyor olarak güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500


# Kargoya Verildi Stage ----------------------------------------------------------

# Edit Button used by Logistics
@return_case_bp.route('/<int:return_case_id>/kargoya-verildi', methods=['PUT'])
@permission_required(AppPermissions.CASE_EDIT_SHIPPING)
def update_kargoya_verildi(return_case_id):
    """Update Kargoya Verildi stage information"""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        data = request.get_json()
        
        # Update shipping info if provided
        if 'shippingInfo' in data:
            return_case.shipping_info = data['shippingInfo']
        
        # Update tracking number if provided
        if 'trackingNumber' in data:
            return_case.tracking_number = data['trackingNumber']
        
        # Update shipping date if provided
        if 'shippingDate' in data and data['shippingDate']:
            return_case.shipping_date = datetime.strptime(data['shippingDate'], '%Y-%m-%d').date()

        db.session.commit()
        return jsonify({"message": "Kargo bilgileri güncellendi"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Complete Button used by Logistics
@return_case_bp.route('/<int:return_case_id>/complete-kargoya-verildi', methods=['POST'])
@permission_required(AppPermissions.CASE_COMPLETE_SHIPPING)
def complete_kargoya_verildi(return_case_id):
    """Complete Kargoya Verildi stage and move to Completed"""
    current_user = get_current_user()
    current_user_name = current_user.get('name', 'Sistem')

    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        if return_case.workflow_status != CaseStatusEnum.SHIPPING:
            return jsonify({"error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"}), 400

        # Validate required fields for Kargoya Verildi stage
        if not return_case.shipping_info:
            return jsonify({"error": "Kargo bilgisi eksik. Lütfen kargo bilgisini belirtin."}), 400
        
        if not return_case.tracking_number:
            return jsonify({"error": "Takip numarası eksik. Lütfen takip numarasını belirtin."}), 400
        
        if not return_case.shipping_date:
            return jsonify({"error": "Kargo tarihi eksik. Lütfen kargo tarihini belirtin."}), 400

        return_case.workflow_status = CaseStatusEnum.COMPLETED
        try:
            CentaEmailService.send_stage_completion_notification(
                case_id=return_case.id,
                completed_stage="Kargoya Verildi",
                next_stage="Tamamlandı",
                updated_by=current_user_name
            )
        except Exception as e:
            logging.error(f"Email notification error for case {return_case.id}: {e}")

        db.session.commit()
        return jsonify({"message": "Kargoya Verildi aşaması tamamlandı, durum Tamamlandı olarak güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Tamamlandı Stage ----------------------------------------------------------

# Edit Button used by Support
@return_case_bp.route('/<int:return_case_id>/tamamlandi', methods=['PUT'])
@jwt_required()
def update_tamamlandi(return_case_id):
    """Update Tamamlandı stage information"""
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        data = request.get_json()
        
        # Update payment status if provided
        if 'paymentStatus' in data:
            payment_key = convert_turkish_to_enum(data['paymentStatus'], PaymentStatusEnum)
            return_case.payment_status = PaymentStatusEnum[payment_key]

        db.session.commit()
        return jsonify({"message": "Tamamlandı bilgileri güncellendi"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# Complete Button used by Support
@return_case_bp.route('/<int:return_case_id>/complete-tamamlandi', methods=['POST'])
@permission_required(AppPermissions.CASE_COMPLETE_COMPLETED)
def complete_tamamlandi(return_case_id):
    """Complete Tamamlandı stage (final stage)"""
    current_user = get_current_user()
    current_user_name = current_user.get('name', 'Sistem')
    try:
        return_case = db.session.get(ReturnCase, return_case_id)
        if not return_case:
            return jsonify({"error": "Vaka bulunamadı"}), 404

        if return_case.workflow_status != CaseStatusEnum.COMPLETED:
            return jsonify({"error": f"Bu aşama şu anda tamamlanamaz. Mevcut durum: {return_case.workflow_status.value}"}), 400

        # Validate required fields for Tamamlandı stage
        if not return_case.payment_status:
            return jsonify({"error": "Ödeme durumu eksik. Lütfen ödeme durumunu belirtin."}), 400

        return_case.workflow_status = CaseStatusEnum.COMPLETED
        try:
            CentaEmailService.send_case_completion_notification(
                case_id=return_case.id,
                completed_by=current_user_name
            )
        except Exception as e:
            logging.error(f"Email notification error for case {return_case.id}: {e}")

        db.session.commit()
        return jsonify({"message": "Tamamlandı aşaması tamamlandı"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

# -------------------------------------------------------------------------------

@return_case_bp.route('/<int:return_case_id>', methods=['DELETE'])
@jwt_required()
def delete_return_case(return_case_id):
    # Get current user information
    identity = get_jwt_identity()
    claims = get_jwt()
    user_role = claims.get("role")
    
    return_case = db.session.get(ReturnCase, return_case_id)
    if not return_case:
        return jsonify({'msg': 'Vaka bulunamadı.'}), 404

    # Check if user can delete this case
    # Only SUPPORT role can delete cases when status is 'Teslim Alındı' or 'Teknik İnceleme'
    if return_case.workflow_status.value in ['Teslim Alındı']:
        if user_role != 'SUPPORT':
            return jsonify({'msg': 'Bu vakayı silmek için SUPPORT rolüne sahip olmanız gerekiyor.'}), 403
    else:
        # For other statuses, no one can delete
        return jsonify({'msg': 'Bu durumdaki vakalar silinemez.'}), 403

    try:
        db.session.delete(return_case)
        db.session.commit()
        return jsonify({'msg': f'Vaka {return_case_id} başarıyla silindi.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Silme işlemi sırasında bir hata oluştu.', 'error': str(e)}), 500

# Email Customer ----------------------------------------------------------

@return_case_bp.route('/<int:return_case_id>/send-customer-email', methods=['POST'])
@jwt_required()
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

        # Get customer information
        customer = return_case.customer
        if not customer:
            return jsonify({"error": "Müşteri bilgisi bulunamadı"}), 404

        # Import the email service
        from services.email_service import CentaEmailService
        
        # Send the email using the provided recipient email
        if CentaEmailService.send_custom_customer_email(
            recipient_email, 
            return_case_id, 
            email_content
        ):
            return jsonify({"message": "E-posta başarıyla gönderildi"}), 200
        else:
            return jsonify({"error": "E-posta gönderilemedi"}), 500

    except Exception as e:
        logging.error(f"Error sending customer email for case {return_case_id}: {str(e)}")
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500