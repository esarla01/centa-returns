# services/email_service.py
import resend
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure ReSend
resend.api_key = os.getenv("RESEND_API_KEY")

# Add validation for API key
if not resend.api_key:
    logging.error("RESEND_API_KEY environment variable is not set!")
else:
    logging.info(f"ReSend API key loaded: {resend.api_key[:10]}...")

# Import models for database queries
from models import ReturnCase, User, Role

class CentaEmailService:
    @staticmethod
    def send_password_reset(user_email, user_name, reset_url):
        """Send password reset email with Centa branding"""
        try:
            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": [user_email],
                "subject": "Centa Arıza Takip Sistemi - Şifre Sıfırlama",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Merhaba {user_name},</h2>
                    
                    <p>Centa Arıza Takip Sistemi'nde şifrenizi sıfırlamak için bir talep aldık.</p>
                    
                    <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #3498db; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Şifremi Sıfırla
                        </a>
                    </div>
                    
                    <p style="color: #7f8c8d; font-size: 14px;">
                        Bu talebi siz yapmadıysanız, bu mesajı dikkate almayın.<br>
                        Bu bağlantı 15 dakika boyunca geçerlidir.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"Şifre sıfırlama e-postası {user_email} adresine gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"Şifre sıfırlama e-postası gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False

    @staticmethod
    def send_user_invitation(user_email, role_name, invitation_url, invited_by_name):
        """Send user invitation email"""
        try:
            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": [user_email],
                "subject": "Centa Arıza Takip Sistemi - Davet",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Merhaba,</h2>
                    
                    <p>Centa Arıza Takip Sistemi'ne davet edildiniz.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Davet Eden:</strong> {invited_by_name}</p>
                        <p><strong>Rol:</strong> {role_name}</p>
                    </div>
                    
                    <p>Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{invitation_url}" 
                           style="background-color: #27ae60; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Hesabımı Aktifleştir
                        </a>
                    </div>
                    
                    <p style="color: #7f8c8d; font-size: 14px;">
                        Bu bağlantı 24 saat boyunca geçerlidir.<br>
                        Hesabınızı aktifleştirdikten sonra şifrenizi belirleyebilir ve sisteme giriş yapabilirsiniz.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"Kullanıcı davet e-postası {user_email} adresine gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"Kullanıcı davet e-postası gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False

    @staticmethod
    def send_welcome_email(user_email, user_name):
        """Send welcome email to new users"""
        try:
            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": [user_email],
                "subject": "Centa Arıza Takip Sistemi - Hoş Geldiniz",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Merhaba {user_name},</h2>
                    
                    <p>Centa Arıza Takip Sistemi'ne hoş geldiniz!</p>
                    
                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
                        <p style="margin: 0; color: #27ae60;">
                            <strong>✓</strong> Hesabınız başarıyla oluşturuldu ve sisteme giriş yapabilirsiniz.
                        </p>
                    </div>
                    
                    <p>Herhangi bir sorunuz için bizimle iletişime geçebilirsiniz.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"Hoş geldin e-postası {user_email} adresine gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"Hoş geldin e-postası gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False

    @staticmethod
    def send_custom_customer_email(customer_email, case_id, email_content):
        """Send custom email to customer about their return case"""
        try:
            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": [customer_email],
                "subject": f"Centa - İade Vakası #{case_id} Bilgilendirmesi",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">İade Vakası #{case_id}</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        {email_content}
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Bu e-posta Centa Arıza Takip Sistemi tarafından otomatik olarak gönderilmiştir.<br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"Özel müşteri e-postası {customer_email} adresine vaka #{case_id} için gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"Özel müşteri e-postası gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False
    
    @staticmethod
    def new_return_case_notification(case_id):
        """Send return case notification to all users"""
        try:
            # Retrieve the list of all user emails
            try:
                users = User.query.all()
                user_emails = [user.email for user in users]
            except Exception as db_error:
                logging.error(f"Database error retrieving users: {db_error}")
                return False
            
            if not user_emails:
                logging.warning("E-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            try:
                case = ReturnCase.query.get(case_id)
                if not case:
                    logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                    return False
            except Exception as db_error:
                logging.error(f"Database error retrieving case {case_id}: {db_error}")
                return False

            # Get customer information
            customer_name = case.customer.name
            customer_contact_info = case.customer.contact_info 
            arrival_date = case.arrival_date.strftime('%d.%m.%Y')

            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": user_emails,
                "subject": f"Centa - İade Vakası #{case_id} - {customer_name} Bildirimi",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Yeni İade Vakası Bildirimi</h2>
                    
                    <p>Centa Arıza Takip Sistemi'nde yeni bir iade vakası oluşturuldu.</p>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Vaka Detayları</h3>
                        <p><strong>Vaka Numarası:</strong> {case_id}</p>
                        <p><strong>Tarih:</strong> {arrival_date}</p>
                        <p><strong>Müşteri:</strong> {customer_name}</p>
                        <p><strong>Müşteri İletişim Bilgileri:</strong> {customer_contact_info}</p>
                    </div>
                    
                    <p>En yakın zamanda iade vakasının durumunu güncelleyiniz.</p>
                    
                    <p>Detaylı bilgi için sistemimize giriş yapabilirsiniz.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"İade vakası #{case_id} bildirimi {len(user_emails)} kullanıcıya gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"İade vakası bildirimi tüm kullanıcılara gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False

    @staticmethod
    def send_stage_completion_notification(case_id, completed_stage, next_stage, updated_by=None):
        """Send notification when a stage is completed and inform about the next stage"""
        try:
            # Define which roles should receive emails for each next stage
            stage_role_mapping = {
                'Teknik İnceleme': ['TECHNICIAN'],
                'Ödeme Tahsilatı': ['SALES'],
                'Kargoya Veriliyor': ['LOGISTICS'],
                'Tamamlandı': ['MANAGER', 'ADMIN']
            }
            
            # Get the roles for the next stage
            next_stage_roles = stage_role_mapping.get(next_stage, [])
            
            if not next_stage_roles:
                logging.warning(f"Sonraki aşama {next_stage} için rol tanımlanmamış")
                return False
            
            # Get users with the appropriate roles for the next stage
            users = User.query.join(Role).filter(Role.name.in_(next_stage_roles)).all()
            user_emails = [user.email for user in users]
            
            if not user_emails:
                logging.warning(f"Sonraki aşama {next_stage} için e-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            case = ReturnCase.query.get(case_id)
            if not case:
                logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                return False

            # Get customer information
            customer_name = case.customer.name
            current_time = datetime.now().strftime('%d.%m.%Y %H:%M')

            # Stage-specific messages
            stage_messages = {
                'Teslim Alındı': {
                    'next_responsible': 'Teknik Servis',
                    'next_action': 'Teknik inceleme yapılacak ve ürün detayları eklenecek'
                },
                'Teknik İnceleme': {
                    'next_responsible': 'Satış Departmanı',
                    'next_action': 'Ödeme tahsilatı yapılacak'
                },
                'Ödeme Tahsilatı': {
                    'next_responsible': 'Lojistik Departmanı',
                    'next_action': 'Kargo işlemleri yapılacak'
                },
                'Kargoya Veriliyor': {
                    'next_responsible': 'Yönetici',
                    'next_action': 'Vaka tamamlanacak'
                }
            }

            stage_info = stage_messages.get(completed_stage, {
                'next_responsible': 'İlgili Departman',
                'next_action': 'Sonraki aşama işlemleri yapılacak'
            })

            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": user_emails,
                "subject": f"Centa - İade Vakası #{case_id} - {customer_name} Aşama Tamamlandı",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Aşama Tamamlandı Bildirimi</h2>
                    
                    <p>İade vakası #{case_id} için aşama tamamlandı.</p>
                    
                    <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                        <h3 style="margin-top: 0; color: #0c5460;">Vaka Bilgileri</h3>
                        <p><strong>Vaka Numarası:</strong> {case_id}</p>
                        <p><strong>Müşteri:</strong> {customer_name}</p>
                        <p><strong>Tamamlanan Aşama:</strong> {completed_stage}</p>
                        <p><strong>Sonraki Aşama:</strong> {next_stage}</p>
                        <p><strong>Güncelleyen:</strong> {updated_by or 'Sistem'}</p>
                        <p><strong>Güncelleme Tarihi:</strong> {current_time}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Sonraki Aşama</h3>
                        <p><strong>Sorumlu:</strong> {stage_info['next_responsible']}</p>
                        <p><strong>Yapılacak İşlem:</strong> {stage_info['next_action']}</p>
                    </div>
                    
                    <p>Lütfen sonraki aşamayı en kısa sürede tamamlayınız.</p>
                    
                    <p>Detaylı bilgi için sistemimize giriş yapabilirsiniz.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"İade vakası #{case_id} aşama tamamlama bildirimi {len(user_emails)} kullanıcıya gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"İade vakası aşama tamamlama bildirimi gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False

    @staticmethod
    def send_case_completion_notification(case_id, completed_by=None):
        """Send notification when a case is fully completed"""
        try:
            # Retrieve the list of all user emails
            users = User.query.filter(User.role.in_(['admin', 'manager'])).all()
            user_emails = [user.email for user in users]
            
            if not user_emails:
                logging.warning("E-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            case = ReturnCase.query.get(case_id)
            if not case:
                logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                return False

            # Get customer information
            customer_name = case.customer.name
            current_time = datetime.now().strftime('%d.%m.%Y %H:%M')

            params = {
                "from": "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>",
                "to": user_emails,
                "subject": f"Centa - İade Vakası #{case_id} Tamamlandı",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Vaka Tamamlandı</h2>
                    
                    <p>İade vakası #{case_id} başarıyla tamamlandı.</p>
                    
                    <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <h3 style="margin-top: 0; color: #155724;">Vaka Bilgileri</h3>
                        <p><strong>Vaka Numarası:</strong> {case_id}</p>
                        <p><strong>Müşteri:</strong> {customer_name}</p>
                        <p><strong>Tamamlayan:</strong> {completed_by or 'Sistem'}</p>
                        <p><strong>Tamamlanma Tarihi:</strong> {current_time}</p>
                    </div>
                    
                    <p>Vaka tüm aşamaları başarıyla tamamlanmıştır.</p>
                    
                    <p>Detaylı bilgi için sistemimize giriş yapabilirsiniz.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Saygılarımızla,<br>
                        <strong>Centa Teknik Servis</strong><br>
                        ariza.takip@centa.com.tr
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            email_id = email.get("id", "unknown")  # safer than email.id
            logging.info(
                f"İade vakası #{case_id} tamamlama bildirimi {len(user_emails)} kullanıcıya gönderildi. ID: {email_id}"
            )
            return True
        except Exception as e:
            logging.error(f"İade vakası tamamlama bildirimi gönderilemedi: {e}")
            logging.error(f"Exception type: {type(e)}")
            logging.error(f"Exception args: {e.args}")
            return False
