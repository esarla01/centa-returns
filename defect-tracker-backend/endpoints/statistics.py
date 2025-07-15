from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from models import db, ReturnCase, Customers, User

statistics_bp = Blueprint('statistics', __name__, url_prefix='/statistics')

@statistics_bp.route('/', methods=['GET'])
@jwt_required()
def get_statistics():
    """
    Get comprehensive statistics about returns, customers, and performance metrics.
    """
    try:
        # Get current date and calculate date ranges
        now = datetime.now()
        six_months_ago = now - timedelta(days=180)
        
        # Monthly returns for the last 6 months
        monthly_returns = db.session.query(
            func.date_trunc('month', ReturnCase.arrival_date).label('month'),
            func.count(ReturnCase.id).label('count')
        ).filter(
            ReturnCase.arrival_date >= six_months_ago
        ).group_by(
            func.date_trunc('month', ReturnCase.arrival_date)
        ).order_by(
            func.date_trunc('month', ReturnCase.arrival_date)
        ).all()
        
        # Company statistics (top companies by return count)
        company_stats = db.session.query(
            Customers.name.label('company'),
            func.count(ReturnCase.id).label('returns')
        ).join(
            ReturnCase, Customers.id == ReturnCase.customer_id
        ).group_by(
            Customers.name
        ).order_by(
            func.count(ReturnCase.id).desc()
        ).limit(10).all()
        
        # Status distribution
        status_distribution = db.session.query(
            ReturnCase.status,
            func.count(ReturnCase.id).label('count')
        ).group_by(
            ReturnCase.status
        ).all()
        
        # Total counts
        total_returns = db.session.query(func.count(ReturnCase.id)).scalar()
        total_customers = db.session.query(func.count(Customers.id)).scalar()
        
        # Calculate total revenue (sum of all costs)
        total_revenue = db.session.query(
            func.coalesce(func.sum(ReturnCase.cost), 0)
        ).scalar()
        
        # Calculate average resolution time
        # This is a simplified calculation - you might want to add a resolved_date field
        avg_resolution_time = 7.5  # Placeholder - implement actual calculation
        
        # Format monthly data
        month_names = {
            1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan', 5: 'Mayıs', 6: 'Haziran',
            7: 'Temmuz', 8: 'Ağustos', 9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
        }
        
        monthly_data = []
        for month_data in monthly_returns:
            month_date = month_data.month
            month_name = month_names.get(month_date.month, month_date.strftime('%B'))
            monthly_data.append({
                'month': month_name,
                'count': month_data.count
            })
        
        # Format company data
        company_data = []
        for company in company_stats:
            company_data.append({
                'company': company.company,
                'returns': company.returns
            })
        
        # Format status data
        status_data = []
        for status in status_distribution:
            status_data.append({
                'status': status.status.value,  # Get the Turkish label
                'count': status.count
            })
        
        return jsonify({
            'monthlyReturns': monthly_data,
            'companyStats': company_data,
            'statusDistribution': status_data,
            'totalReturns': total_returns,
            'totalCustomers': total_customers,
            'totalRevenue': float(total_revenue) if total_revenue else 0,
            'averageResolutionTime': avg_resolution_time
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500 