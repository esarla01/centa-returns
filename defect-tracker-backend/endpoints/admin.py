from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from models import AppPermissions, Permission, Role, RolePermission, User, UserRole, db
from permissions import permission_required
import re
from sqlalchemy import or_
import os
import secrets
from datetime import datetime, timedelta
from services.email_service import CentaEmailService
from flask_jwt_extended import get_jwt_identity
import datetime

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")


@admin_bp.route('/invite-user', methods=['POST'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def invite_user():
    data = request.get_json()
    
    if not data:
        return jsonify({"msg": "Veri sağlanmadı"}), 400

    email = data.get('email')
    role = data.get('role')


    # Validate required fields
    if not email or not role:
        return jsonify({"msg": "Tüm alanlar gereklidir"}), 400

    # Validate email format
    if not EMAIL_REGEX.match(email):
        return jsonify({"msg": "Geçersiz e-posta formatı"}), 400

    # Validate role
    try:
        role_enum = UserRole(role)
    except ValueError:
        return jsonify({"msg": "Geçersiz rol"}), 400

    # Look up the Role object
    role_obj = Role.query.filter_by(name=role_enum).first()
    if not role_obj:
        return jsonify({"msg": "Rol veritabanında bulunamadı"}), 400

    # Check if the user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user and existing_user.password_hash:
        return jsonify({"msg": "Bu e-posta adresi ile bir kullanıcı zaten mevcut"}), 400
    
    is_already_invited = False
    if existing_user and existing_user.invitation_token:
        is_already_invited = True

    try:
        # Generate invitation token
        invitation_token = secrets.token_urlsafe(32)
        invitation_expiry = datetime.datetime.utcnow() + timedelta(hours=24)
        
        # Get current user (admin who is sending invitation)
        current_user_email = get_jwt_identity()
        
        if is_already_invited:
            # Update existing invitation
            existing_user.invitation_token = invitation_token
            existing_user.invitation_expiry = invitation_expiry
            existing_user.invited_by = current_user_email
            existing_user.invited_at = datetime.datetime.utcnow()
            user = existing_user  # So we can return user.to_dict() below
        else:
            # Create new invited user
            user = User(
                email=email,
                role_id=role_obj.id,
                invitation_token=invitation_token,
                invitation_expiry=invitation_expiry,
                invited_by=current_user_email,
                invited_at=datetime.datetime.utcnow()
            )         
            db.session.add(user)
        
        db.session.commit()

        # Send invitation email
        invitation_url = f"https://centa-returns-frontend-production.up.railway.app/accept-invitation?token={invitation_token}"        
        
        if CentaEmailService.send_user_invitation(
            email, 
            role_enum.value,
            invitation_url,
            current_user_email
        ):
            return jsonify({
                "msg": f"{email} adresine davet e-postası gönderildi",
                "user": user.to_dict()
            }), 200
        else:
            # Rollback if email fails
            db.session.rollback()
            return jsonify({"msg": "Davet e-postası gönderilemedi. Lütfen tekrar deneyin."}), 500

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"msg": "Kullanıcı davet edilirken bir hata oluştu", "error": str(e)}), 500

@admin_bp.route('', methods=['DELETE'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def deregister():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Veri sağlanmadı"}), 400
    
    target_email = data.get('email')  

    if not target_email:
        return jsonify({"msg": "Kayıt silinecek kullanıcının e-posta adresi gereklidir"}), 400
    
    # Prevent deletion of a specific user
    if target_email == "erinsarlak003@gmail.com":
        return jsonify({"msg": "Bu kullanıcı kayıt silinemez"}), 403
    
    # Query user by email
    user_to_delete = User.query.filter_by(email=target_email).first()

    if not user_to_delete:
        return jsonify({"msg": f'{target_email} e-posta adresine sahip kullanıcı bulunamadı'}), 404
    
    try:
        db.session.delete(user_to_delete)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Kullanıcı kayıt silinirken bir hata oluştu", "error": str(e)}), 500

    return jsonify({"msg": f'{user_to_delete.first_name} {user_to_delete.last_name} kullanıcısının kaydı başarıyla silindi'}), 200

@admin_bp.route('/toggle-email-notifications', methods=['PATCH'])
@permission_required(AppPermissions.PAGE_VIEW_ADMIN)
def toggle_email_notifications():
    """Toggle email notifications for a specific user"""
    data = request.get_json()

    if not data:
        return jsonify({"msg": "Veri sağlanmadı"}), 400

    target_email = data.get('email')
    enabled = data.get('enabled')  # Boolean

    if not target_email:
        return jsonify({"msg": "E-posta adresi gereklidir"}), 400

    if enabled is None:
        return jsonify({"msg": "Bildirim durumu belirtilmelidir"}), 400

    # Query user by email
    user = User.query.filter_by(email=target_email).first()

    if not user:
        return jsonify({"msg": f'{target_email} e-posta adresine sahip kullanıcı bulunamadı'}), 404

    try:
        user.email_notifications_enabled = bool(enabled)
        db.session.commit()

        status_text = "aktifleştirildi" if enabled else "devre dışı bırakıldı"
        return jsonify({
            "msg": f'{user.first_name} {user.last_name} için e-posta bildirimleri {status_text}',
            "user": user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "msg": "Bildirim tercihi güncellenirken bir hata oluştu",
            "error": str(e)
        }), 500

@admin_bp.route('', methods=['GET'])
@jwt_required()
def retrieve_users():
    """
    Retrieve a paginated, searchable, and filterable list of users
    using Flask-SQLAlchemy's paginate() function.
    """

    # Get the page, limit, search, and role filter from the request
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 5, type=int)
    search = request.args.get('search', '', type=str).strip()
    role_filter = request.args.get('role', '', type=str) # e.g., "ADMIN", "MANAGER"
    
    print(f"Role filter received: '{role_filter}'")
    print(f"Available UserRole members: {list(UserRole._member_map_.keys())}")

    # Get the users and their roles
    query = db.session.query(User).join(Role)

    # If there is a search term, filter the users by first name, last name, and email
    if search:
        query = query.filter(
            or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    # If there is a role filter, filter the users by role
    if role_filter and role_filter.upper() in UserRole._member_map_:
        print(f"Filtering by role: {role_filter.upper()}")
        query = query.filter(Role.name == UserRole[role_filter.upper()])
    else:
        print(f"Role filter not applied. role_filter: '{role_filter}', upper: '{role_filter.upper() if role_filter else ''}', in map: {role_filter.upper() in UserRole._member_map_ if role_filter else False}")
    
    # Paginate the users
    paginated_users = query.order_by(Role.name).paginate(
        page=page, 
        per_page=limit, 
        error_out=False
    )

    # Serialize the users
    def serialize_user(user):
       return {
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.name.value,
        "createdAt": (
            user.accepted_at.strftime("%d %b %Y %H:%M")
            .replace("Jan", "Oca")
            .replace("Feb", "Şub")
            .replace("Mar", "Mar")
            .replace("Apr", "Nis")
            .replace("May", "May")
            .replace("Jun", "Haz")
            .replace("Jul", "Tem")
            .replace("Aug", "Ağu")
            .replace("Sep", "Eyl")
            .replace("Oct", "Eki")
            .replace("Nov", "Kas")
            .replace("Dec", "Ara")
        ) if user.accepted_at else None,
        "invitedAt": (
            user.invited_at.strftime("%d %b %Y %H:%M")
            .replace("Jan", "Oca")
            .replace("Feb", "Şub")
            .replace("Mar", "Mar")
            .replace("Apr", "Nis")
            .replace("May", "May")
            .replace("Jun", "Haz")
            .replace("Jul", "Tem")
            .replace("Aug", "Ağu")
            .replace("Sep", "Eyl")
            .replace("Oct", "Eki")
            .replace("Nov", "Kas")
            .replace("Dec", "Ara")
        ) if user.invited_at else None,
        "lastLogin": (
            user.last_login.strftime("%d %b %Y %H:%M")
            .replace("Jan", "Oca")
            .replace("Feb", "Şub")
            .replace("Mar", "Mar")
            .replace("Apr", "Nis")
            .replace("May", "May")
            .replace("Jun", "Haz")
            .replace("Jul", "Tem")
            .replace("Aug", "Ağu")
            .replace("Sep", "Eyl")
            .replace("Oct", "Eki")
            .replace("Nov", "Kas")
            .replace("Dec", "Ara")
        ) if user.last_login else None,
        "invitedBy": user.invited_by,
        "isInvited": bool(user.invitation_token and user.invitation_expiry and user.invitation_expiry > datetime.datetime.utcnow()),
        "isActive": bool(user.password_hash),
        "emailNotificationsEnabled": user.email_notifications_enabled
       }

    # Return the serialized users
    return jsonify({
        "users": [serialize_user(u) for u in paginated_users.items],
        "totalPages": paginated_users.pages,
        "currentPage": paginated_users.page,
        "totalUsers": paginated_users.total
    }) 