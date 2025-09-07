from models import UserActionLog, ActionType, ReturnCase, Customers, ProductModel, ServiceDefinition, db
import json
from datetime import datetime

class LogService:
    """
    Service class for logging user actions related to return cases and other entities
    """
    
    @staticmethod
    def log_return_case_action(user_email, return_case_id, action_type, additional_info=None):
        """
        Log actions related to return cases
        """
        # Validate required parameters
        if not user_email or not return_case_id or not action_type:
            raise ValueError("Missing required parameters: user_email, return_case_id, and action_type are required")
        
        # Validate that the return case exists
        case = ReturnCase.query.get(return_case_id)
        if not case:
            raise ValueError(f"ReturnCase with id {return_case_id} not found")
        
        # Create the log entry
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=return_case_id,
            action_type=action_type,
            additional_info=additional_info
        )
        
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def log_customer_creation(user_email, customer_id):
        """
        Log customer creation actions
        
        """
        # Validate required parameters
        if not user_email or not customer_id:
            raise ValueError("Missing required parameters: user_email and customer_id are required")
        
        # Validate that the customer exists
        customer = Customers.query.get(customer_id)
        if not customer:
            raise ValueError(f"Customer with id {customer_id} not found")
        
        # Create the log entry (using return_case_id=0 to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.CUSTOMER_CREATED,
            additional_info=f"Müşteri Adı: {customer.name}"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def log_product_model_creation(user_email, product_model_id):
        """
        Log product model creation actions

        """
        # Validate required parameters
        if not user_email or not product_model_id:
            raise ValueError("Missing required parameters: user_email and product_model_id are required")
        
        # Validate that the product model exists
        product_model = ProductModel.query.get(product_model_id)
        if not product_model:
            raise ValueError(f"ProductModel with id {product_model_id} not found")

        product_model_name = product_model.name
        
        # Create the log entry (using return_case_id=0 to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.PRODUCT_CREATED,
            additional_info=f"Ürün Modeli Adı: {product_model_name}"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_case_action_logs(return_case_id, limit=None):
        """
        Get all action logs for a specific return case
        
        Args:
            return_case_id (int): ID of the return case
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        query = UserActionLog.query.filter_by(return_case_id=return_case_id).order_by(UserActionLog.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    @staticmethod
    def get_user_action_logs(user_email, limit=None):
        """
        Get all action logs for a specific user
        
        Args:
            user_email (str): Email of the user
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        query = UserActionLog.query.filter_by(user_email=user_email).order_by(UserActionLog.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    @staticmethod
    def get_action_logs_by_type(action_type, limit=None):
        """
        Get all action logs of a specific type
        
        Args:
            action_type (ActionType): Type of action to filter by
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        query = UserActionLog.query.filter_by(action_type=action_type).order_by(UserActionLog.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    @staticmethod
    def get_recent_action_logs(limit=50):
        """
        Get recent action logs across all cases
        
        Args:
            limit (int): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        return UserActionLog.query.order_by(UserActionLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_case_creation_logs(limit=None):
        """
        Get all case creation logs
        
        Args:
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        return LogService.get_action_logs_by_type(ActionType.CASE_CREATED, limit)
    
    @staticmethod
    def get_stage_completion_logs(stage_action_type, limit=None):
        """
        Get all logs for a specific stage completion
        
        Args:
            stage_action_type (ActionType): The stage completion action type
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        return LogService.get_action_logs_by_type(stage_action_type, limit)
    
    @staticmethod
    def get_email_sent_logs(limit=None):
        """
        Get all email sent logs
        
        Args:
            limit (int, optional): Maximum number of logs to return
            
        Returns:
            list: List of UserActionLog objects
        """
        return LogService.get_action_logs_by_type(ActionType.EMAIL_SENT, limit)
    
    @staticmethod
    def format_log_description(log_entry):
        """
        Format a log entry into a human-readable description
        
        Args:
            log_entry (UserActionLog): The log entry to format
            
        Returns:
            str: Formatted description
        """
        user_name = f"{log_entry.user.first_name} {log_entry.user.last_name}" if log_entry.user else log_entry.user_email
        
        if log_entry.action_type == ActionType.CASE_CREATED:
            return f"The new case #{log_entry.return_case_id} is created by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.STAGE_DELIVERED_COMPLETED:
            return f"The 'Teslim Alındı' stage is completed in case #{log_entry.return_case_id} by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.STAGE_TECHNICAL_REVIEW_COMPLETED:
            return f"The 'Teknik İnceleme' stage is completed in case #{log_entry.return_case_id} by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.STAGE_PAYMENT_COLLECTION_COMPLETED:
            return f"The 'Ödeme Tahsilatı' stage is completed in case #{log_entry.return_case_id} by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.STAGE_SHIPPING_COMPLETED:
            return f"The 'Kargoya Veriliyor' stage is completed in case #{log_entry.return_case_id} by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.CASE_COMPLETED:
            return f"The case #{log_entry.return_case_id} is completed by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.EMAIL_SENT:
            email_address = log_entry.additional_info or "unknown"
            return f"The completed case #{log_entry.return_case_id} email is sent to the email address {email_address} by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.NEW_CUSTOMER_CREATED:
            return f"New customer #{log_entry.additional_info or 'unknown'} is created by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        elif log_entry.action_type == ActionType.NEW_PRODUCT_MODEL_CREATED:
            return f"New product model #{log_entry.additional_info or 'unknown'} is created by {user_name}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"
        
        else:
            return f"Action {log_entry.action_type.value} performed by {user_name} on case #{log_entry.return_case_id}. ({log_entry.created_at.strftime('%Y-%m-%d %H:%M:%S')})"

    @staticmethod
    def log_service_creation(user_email, service_id):
        """
        Log service creation action
        """
        # Validate required parameters
        if not user_email or not service_id:
            raise ValueError("Missing required parameters: user_email and service_id are required")
        
        # Validate that the service exists
        service = ServiceDefinition.query.get(service_id)
        if not service:
            raise ValueError(f"ServiceDefinition with id {service_id} not found")

        service_name = service.service_name
        
        # Create the log entry (using return_case_id=None to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.SERVICE_CREATED,
            additional_info=f"Arıza Tipi: {service_name}"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def log_service_deletion(user_email, service_id, service_name):
        """
        Log service deletion action
        """
        # Validate required parameters
        if not user_email or not service_id or not service_name:
            raise ValueError("Missing required parameters: user_email, service_id, and service_name are required")
        
        # Create the log entry (using return_case_id=None to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.SERVICE_DELETED,
            additional_info=f"Arıza Tipi: {service_name})"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def log_product_deletion(user_email, product_id, product_name):
        """
        Log product deletion action
        """
        # Validate required parameters
        if not user_email or not product_id or not product_name:
            raise ValueError("Missing required parameters: user_email, product_id, and product_name are required")
        
        # Create the log entry (using return_case_id=None to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.PRODUCT_DELETED,
            additional_info=f"Ürün Modeli Adı: {product_name}"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def log_customer_deletion(user_email, customer_id, customer_name):
        """
        Log customer deletion action
        """
        # Validate required parameters
        if not user_email or not customer_id or not customer_name:
            raise ValueError("Missing required parameters: user_email, customer_id, and customer_name are required")
        
        # Create the log entry (using return_case_id=None to indicate it's not a return case action)
        log_entry = UserActionLog(
            user_email=user_email,
            return_case_id=None,
            action_type=ActionType.CUSTOMER_DELETED,
            additional_info=f"Müşteri Adı: {customer_name}"
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            raise e