from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import UserActionLog, db, User
from sqlalchemy import desc, cast, String
from permissions import permission_required
from models import AppPermissions

user_action_logs_bp = Blueprint('user_action_logs', __name__, url_prefix='/user-action-logs')

@user_action_logs_bp.route('', methods=['GET'])
@permission_required(AppPermissions.PAGE_VIEW_CASE_TRACKING)
def get_user_action_logs():
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        
        # Build query with join to User table
        query = UserActionLog.query.join(User, UserActionLog.user_email == User.email)
        
        # Apply search filter only if search term is provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    UserActionLog.user_email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    UserActionLog.additional_info.ilike(search_term)
                )
            )
        
        # Use paginate method like in products endpoint
        paginated_logs = query.order_by(desc(UserActionLog.created_at)).paginate(page=page, per_page=limit, error_out=False)
        
        # Convert to dictionary format manually
        logs_data = []
        for log in paginated_logs.items:
            try:
                # Get user name from the joined User table
                user_name = f"{log.user.first_name} {log.user.last_name}" if log.user and log.user.first_name and log.user.last_name else log.user_email
                
                log_dict = {
                    'id': log.id,
                    'user_email': log.user_email,
                    'user_name': user_name,
                    'return_case_id': log.return_case_id,
                    'action_type': log.action_type.value if hasattr(log.action_type, 'value') else str(log.action_type),
                    'additional_info': log.additional_info,
                    'created_at': log.created_at.isoformat() if log.created_at else None
                }
                logs_data.append(log_dict)
            except Exception as log_error:
                print(f"Error processing log {log.id}: {log_error}")
                # Skip this log if there's an error
                continue
        
        return jsonify({
            'logs': logs_data,
            'totalPages': paginated_logs.pages,
            'currentPage': page,
            'totalCount': paginated_logs.total
        })
        
    except Exception as e:
        print(f"Error in get_user_action_logs: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
